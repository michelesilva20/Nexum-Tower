import { NexumBadge } from "@/components/ui/nexum/nexum-badge";
import { tripStatusStyles, type TripStatusKey } from "@/lib/status-styles";

type NexumStatusBadgeProps = {
  status: TripStatusKey;
  className?: string;
};

export function NexumStatusBadge({ status, className }: NexumStatusBadgeProps) {
  const style = tripStatusStyles[status];
  return (
    <NexumBadge variant={style.variant} className={className} dot>
      {style.label}
    </NexumBadge>
  );
}
