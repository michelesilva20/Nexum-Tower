/**
 * Padrão de paginação da plataforma (Nexum Core Platform).
 * Services que retornam este formato são automaticamente convertidos
 * pelo GlobalResponseInterceptor no envelope `{ data, pagination }`.
 */
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
};

export type PaginationInput = {
  page?: string | number;
  perPage?: string | number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 200;

/** Normaliza parâmetros de paginação vindos da query string. */
export function resolvePagination(input: PaginationInput): { page: number; perPage: number; skip: number; take: number } {
  const page = Math.max(DEFAULT_PAGE, Number(input.page) || DEFAULT_PAGE);
  const perPageRaw = Number(input.perPage) || DEFAULT_PER_PAGE;
  const perPage = Math.min(Math.max(1, perPageRaw), MAX_PER_PAGE);

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

export function buildPaginatedResult<T>(items: T[], total: number, page: number, perPage: number): PaginatedResult<T> {
  return { items, total, page, perPage };
}

export function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.items) &&
    typeof candidate.total === "number" &&
    typeof candidate.page === "number" &&
    typeof candidate.perPage === "number"
  );
}
