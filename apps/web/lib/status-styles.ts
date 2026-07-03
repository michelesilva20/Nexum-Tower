export type TripStatusKey =
  | "PLANNED"
  | "WAITING_PICKUP"
  | "LOADING"
  | "IN_TRANSIT"
  | "STOPPED"
  | "WAITING_UNLOAD"
  | "DELIVERED"
  | "FINISHED"
  | "CANCELLED"
  | "WITH_INCIDENT";

export type NexumBadgeVariant =
  | "success"
  | "warning"
  | "risk"
  | "danger"
  | "info"
  | "neutral"
  | "primary"
  | "outline";

export const tripStatusStyles: Record<
  TripStatusKey,
  { label: string; variant: NexumBadgeVariant }
> = {
  PLANNED: { label: "Planejada", variant: "info" },
  WAITING_PICKUP: { label: "Aguardando coleta", variant: "primary" },
  LOADING: { label: "Carregando", variant: "primary" },
  IN_TRANSIT: { label: "Em trânsito", variant: "success" },
  STOPPED: { label: "Parada", variant: "risk" },
  WAITING_UNLOAD: { label: "Aguardando descarga", variant: "warning" },
  DELIVERED: { label: "Entregue", variant: "success" },
  FINISHED: { label: "Finalizada", variant: "neutral" },
  CANCELLED: { label: "Cancelada", variant: "danger" },
  WITH_INCIDENT: { label: "Com ocorrência", variant: "danger" },
};

export const badgeVariantClasses: Record<NexumBadgeVariant, string> = {
  success:
    "border-nexum-success/30 bg-nexum-success-bg text-nexum-success",
  warning:
    "border-nexum-warning/30 bg-nexum-warning-bg text-nexum-warning",
  risk: "border-nexum-risk/30 bg-nexum-risk-bg text-nexum-risk",
  danger:
    "border-nexum-danger/30 bg-nexum-danger-bg text-nexum-danger",
  info: "border-nexum-accent/30 bg-nexum-info-bg text-nexum-accent",
  neutral:
    "border-nexum-neutral/30 bg-nexum-surface/50 text-nexum-text-muted",
  primary:
    "border-nexum-primary/30 bg-nexum-primary/10 text-nexum-primary",
  outline:
    "border-nexum-border bg-transparent text-nexum-text-muted",
};
