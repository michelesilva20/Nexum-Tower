import type { NexumBadgeVariant } from "@/lib/status-styles";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return "LOW";
  if (score <= 60) return "MEDIUM";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
}

export const riskLevelStyles: Record<
  RiskLevel,
  { label: string; variant: NexumBadgeVariant }
> = {
  LOW: { label: "Baixo", variant: "success" },
  MEDIUM: { label: "Médio", variant: "warning" },
  HIGH: { label: "Alto", variant: "risk" },
  CRITICAL: { label: "Crítico", variant: "danger" },
};

export function getRiskStyle(score: number) {
  const level = getRiskLevel(score);
  return { level, ...riskLevelStyles[level] };
}
