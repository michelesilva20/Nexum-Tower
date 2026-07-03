/**
 * Converte durações no formato `<numero><unidade>` (ex.: "15m", "7d")
 * para milissegundos. Compartilhado por auth service e controller para
 * evitar divergência entre expiração do token e maxAge do cookie.
 */
const UNIT_MULTIPLIERS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDurationMs(value: string, fallbackMs: number): number {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = match[2];
  return amount * (UNIT_MULTIPLIERS[unit] ?? 60_000);
}

export const DEFAULT_ACCESS_TOKEN_MS = 15 * 60 * 1000;
export const DEFAULT_REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;
