import { useState, useCallback } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationControls {
  pagination: PaginationState;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  reset: () => void;
}

export function usePagination(initialLimit: number = 20): PaginationControls {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });

  const setTotal = useCallback((total: number) => {
    setPagination(prev => ({
      ...prev,
      total,
      totalPages: Math.ceil(total / prev.limit)
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(1, Math.min(page, prev.totalPages))
    }));
  }, []);

  const nextPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: Math.min(prev.page + 1, prev.totalPages)
    }));
  }, []);

  const prevPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(prev.page - 1, 1)
    }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({
      ...prev,
      limit,
      page: 1, // Reset to first page when changing limit
      totalPages: Math.ceil(prev.total / limit)
    }));
  }, []);

  const reset = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: 1,
      total: 0,
      totalPages: 0
    }));
  }, []);

  return {
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setLimit,
    setTotal,
    reset
  };
}