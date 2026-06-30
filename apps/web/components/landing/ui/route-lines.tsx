import { cn } from "@nexum-tower/ui";

type RouteLinesProps = {
  className?: string;
  variant?: "horizontal" | "vertical" | "hero";
};

export function RouteLines({ className, variant = "horizontal" }: RouteLinesProps) {
  if (variant === "vertical") {
    return (
      <svg
        className={cn("pointer-events-none absolute inset-y-0 left-1/2 h-full w-px -translate-x-1/2", className)}
        aria-hidden="true"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="100%"
          stroke="url(#routeGradV)"
          strokeWidth="2"
          className="route-flow"
        />
        <defs>
          <linearGradient id="routeGradV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="30%" stopColor="var(--nexum-primary)" stopOpacity="0.5" />
            <stop offset="70%" stopColor="var(--nexum-secondary)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (variant === "hero") {
    return (
      <svg
        viewBox="0 0 800 400"
        className={cn("pointer-events-none absolute inset-0 h-full w-full opacity-40", className)}
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 200 Q 200 80 400 200 T 800 180"
          fill="none"
          stroke="var(--nexum-primary)"
          strokeWidth="1.5"
          strokeOpacity="0.4"
          className="route-flow"
        />
        <path
          d="M 50 280 Q 250 120 450 260 T 750 220"
          fill="none"
          stroke="var(--nexum-secondary)"
          strokeWidth="1"
          strokeOpacity="0.3"
          className="route-flow"
          style={{ animationDelay: "1s" }}
        />
        <circle cx="400" cy="200" r="4" fill="var(--nexum-primary)" className="pulse-dot" />
        <circle cx="200" cy="140" r="3" fill="var(--nexum-secondary)" className="pulse-dot" />
        <circle cx="600" cy="190" r="3" fill="var(--nexum-accent)" className="pulse-dot" />
      </svg>
    );
  }

  return (
    <svg
      className={cn("pointer-events-none h-px w-full", className)}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <line
        x1="0"
        y1="0"
        x2="100%"
        y2="0"
        stroke="url(#routeGradH)"
        strokeWidth="2"
        className="route-flow"
      />
      <defs>
        <linearGradient id="routeGradH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="var(--nexum-primary)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--nexum-secondary)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
