import { useState, useCallback } from 'react';

export function useOptimisticUpdate<T>(
  updateFn: (data: T) => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void
) {
  const [isUpdating, setIsUpdating] = useState(false);

  const update = useCallback(async (optimisticData: T, rollbackFn: () => void) => {
    setIsUpdating(true);
    try {
      const result = await updateFn(optimisticData);
      onSuccess?.(result);
      return result;
    } catch (error) {
      rollbackFn();
      onError?.(error as Error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [updateFn, onSuccess, onError]);

  return { update, isUpdating };
}