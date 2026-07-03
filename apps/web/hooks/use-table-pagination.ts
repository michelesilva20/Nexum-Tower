"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type UseTablePaginationOptions = {
  initialPage?: number;
  initialPageSize?: number;
};

export function useTablePagination<T>(
  items: T[],
  { initialPage = 1, initialPageSize = 10 }: UseTablePaginationOptions = {},
) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page,
    pageSize,
    total,
    totalPages,
    paginatedItems,
    setPage,
    setPageSize: handlePageSizeChange,
    resetPage,
    pagination: {
      page,
      pageSize,
      total,
      onPageChange: setPage,
      onPageSizeChange: handlePageSizeChange,
    },
  };
}
