import { BarChart3 } from "lucide-react";
import { Link } from "@/i18n/navigation";

type LogoProps = {
  className?: string;
  showText?: boolean;
};

export function NexumLogo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 ${className ?? ""}`}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-nexum-primary/30 bg-nexum-surface">
        <div className="absolute inset-1 rounded-md bg-gradient-to-br from-nexum-primary/20 to-nexum-secondary/10" />
        <BarChart3 className="relative h-5 w-5 text-nexum-primary" strokeWidth={1.75} aria-hidden="true" />
      </div>
      {showText && (
        <span className="text-lg font-semibold tracking-tight text-nexum-text">Nexum Tower</span>
      )}
    </Link>
  );
}
