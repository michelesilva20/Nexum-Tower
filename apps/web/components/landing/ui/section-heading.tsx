import { cn } from "@nexum-tower/ui";
import { SectionBadge } from "./section-badge";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <SectionBadge className="mb-4" pulse>
          {eyebrow}
        </SectionBadge>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-nexum-text sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-nexum-text-muted">{subtitle}</p>
      )}
    </div>
  );
}
