import { NexumBadge } from "@/components/ui/nexum/nexum-badge";
import { getRiskStyle } from "@/lib/risk-styles";

type NexumRiskBadgeProps = {
  score: number;
  className?: string;
};

export function NexumRiskBadge({ score, className }: NexumRiskBadgeProps) {
  const { label, variant } = getRiskStyle(score);
  return (
    <NexumBadge variant={variant} className={className}>
      {label} · {score}
    </NexumBadge>
  );
}
