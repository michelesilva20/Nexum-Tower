import { cn } from "@nexum-tower/ui";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type NexumButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "warning"
  | "link";

const variantClasses: Record<NexumButtonVariant, string> = {
  primary:
    "btn-gradient text-nexum-primary-foreground shadow-[0_4px_24px_rgba(34,211,238,0.2)] hover:shadow-[0_6px_28px_rgba(34,211,238,0.28)]",
  secondary:
    "border border-nexum-border bg-nexum-surface text-nexum-text hover:border-nexum-primary/40 hover:bg-nexum-surface-hover",
  outline:
    "border border-nexum-border bg-transparent text-nexum-text hover:border-nexum-primary/40 hover:bg-nexum-surface/40",
  ghost:
    "bg-transparent text-nexum-text-muted hover:bg-nexum-surface hover:text-nexum-text",
  danger:
    "border border-nexum-danger/40 bg-nexum-danger-bg text-nexum-danger hover:bg-nexum-danger/20",
  success:
    "border border-nexum-success/40 bg-nexum-success-bg text-nexum-success hover:bg-nexum-success/20",
  warning:
    "border border-nexum-warning/40 bg-nexum-warning-bg text-nexum-warning hover:bg-nexum-warning/20",
  link: "bg-transparent p-0 text-nexum-primary underline-offset-4 hover:underline h-auto",
};

type NexumButtonSize = "sm" | "md" | "lg";

const sizeClasses: Record<NexumButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4",
  lg: "h-12 px-6 text-base",
};

type NexumButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: NexumButtonVariant;
  size?: NexumButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

export function NexumButton({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  iconLeft,
  iconRight,
  children,
  ...props
}: NexumButtonProps) {
  const isLink = variant === "link";

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexum-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-nexum-bg",
        "disabled:pointer-events-none disabled:opacity-50",
        !isLink && sizeClasses[size],
        "text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
}
