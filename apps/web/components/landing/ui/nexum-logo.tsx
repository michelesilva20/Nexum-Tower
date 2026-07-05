import { BRAND_LOGO_PATH, BRAND_NAME } from "@/lib/brand";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

type LogoProps = {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-16 w-16",
} as const;

const imageSizes = {
  sm: 40,
  md: 56,
  lg: 64,
} as const;

export function NexumLogo({ className, showText = true, size = "md" }: LogoProps) {
  const px = imageSizes[size];

  return (
    <Link href="/" className={`flex items-center gap-3 ${className ?? ""}`}>
      <Image
        src={BRAND_LOGO_PATH}
        alt={BRAND_NAME}
        width={px}
        height={px}
        className={`${sizeClasses[size]} shrink-0 rounded-xl object-contain`}
        priority
      />
      {showText && (
        <span className="text-xl font-semibold tracking-tight text-nexum-text">{BRAND_NAME}</span>
      )}
    </Link>
  );
}
