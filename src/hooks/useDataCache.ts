import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  ttl: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true,
  maxRetries: 3,
  retryDelay: 1000
};

export function useDataCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCachedData = useCallback((cacheKey: string): CacheEntry<T> | null => {
    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > opts.ttl;
    
    if (isExpired) {
      cached.isStale = true;
    }

    return cached;
  }, [opts.ttl]);

  const setCachedData = useCallback((cacheKey: string, newData: T) => {
    cacheRef.current.set(cacheKey, {
      data: newData,
      timestamp: Date.now(),
      isStale: false
    });
  }, []);

  const fetchWithRetry = useCallback(async (
    fetchFunction: () => Promise<T>,
    retryCount = 0
  ): Promise<T> => {
    try {
      return await fetchFunction();
    } catch (err) {
      if (retryCount < opts.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, opts.retryDelay * Math.pow(2, retryCount)));
        return fetchWithRetry(fetchFunction, retryCount + 1);
      }
      throw err;
    }
  }, [opts.maxRetries, opts.retryDelay]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const cached = getCachedData(key);
    
    // Return cached data if available and not forcing refresh
    if (cached && !forceRefresh) {
      setData(cached.data);
      setIsStale(cached.isStale);
      setLoading(false);
      setError(null);
      
      // If stale and staleWhileRevalidate is enabled, fetch in background
      if (cached.isStale && opts.staleWhileRevalidate) {
        // Continue to fetch fresh data without setting loading state
      } else {
        return cached.data;
      }
    }

    // Set loading state only if we don't have cached data
    if (!cached || forceRefresh) {
      setLoading(true);
    }

    abortControllerRef.current = new AbortController();
    
    try {
      const freshData = await fetchWithRetry(fetchFn);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return cached?.data || null;
      }

      setCachedData(key, freshData);
      setData(freshData);
      setIsStale(false);
      setError(null);
      retryCountRef.current = 0;
      
      return freshData;
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return cached?.data || null;
      }

      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      
      // If we have cached data, keep showing it despite the error
      if (cached && opts.staleWhileRevalidate) {
        setData(cached.data);
        setIsStale(true);
      }
      
      throw error;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [key, fetchFn, getCachedData, setCachedData, fetchWithRetry, opts.staleWhileRevalidate]);

  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
    setIsStale(true);
  }, [key]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const mutate = useCallback((newData: T | ((prevData: T | null) => T)) => {
    const updatedData = typeof newData === 'function' 
      ? (newData as (prevData: T | null) => T)(data)
      : newData;
    
    setCachedData(key, updatedData);
    setData(updatedData);
    setIsStale(false);
    setError(null);
  }, [key, data, setCachedData]);

  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [key]); // Only depend on key, not fetchData to avoid infinite loops

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    invalidate,
    mutate
  };
}