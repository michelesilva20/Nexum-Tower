import { cn } from "@nexum-tower/ui";

type AnimatedGridProps = {
  className?: string;
  opacity?: number;
};

export function AnimatedGrid({ className, opacity = 0.35 }: AnimatedGridProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 grid-pattern", className)}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
