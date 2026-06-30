import { cn } from "@nexum-tower/ui";

type GlassCardProps = React.ComponentPropsWithoutRef<"div"> & {
  strong?: boolean;
  hover?: boolean;
};

export function GlassCard({
  className,
  strong = false,
  hover = true,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        "rounded-2xl",
        hover &&
          "transition-all duration-300 hover:border-nexum-primary/30 hover:shadow-[0_8px_32px_rgba(34,211,238,0.08)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
