import { cn } from "@nexum-tower/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type GradientButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  icon?: boolean;
};

export function GradientButton({
  href,
  children,
  variant = "primary",
  className,
  icon = false,
}: GradientButtonProps) {
  if (variant === "primary") {
    return (
      <Link
        href={href}
        className={cn(
          "btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-nexum-primary-foreground shadow-[0_4px_24px_rgba(34,211,238,0.2)] transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexum-primary",
          className,
        )}
      >
        {children}
        {icon && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-nexum-border bg-nexum-surface/60 px-6 py-3 text-sm font-semibold text-nexum-text backdrop-blur-sm transition-colors hover:border-nexum-primary/40 hover:bg-nexum-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexum-primary",
        className,
      )}
    >
      {children}
    </Link>
  );
}
