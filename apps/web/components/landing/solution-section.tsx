"use client";

import { FadeIn, StaggerContainer, StaggerItem } from "@/components/landing/ui/fade-in";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

const flowKeys = [
  "cargo",
  "trip",
  "monitoring",
  "issue",
  "proof",
  "closing",
  "intelligence",
] as const;

export function SolutionSection() {
  const t = useTranslations("landing.solution");

  return (
    <section id="solucao" className="relative bg-nexum-bg-soft/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="relative mt-16 overflow-x-auto pb-4">
          <StaggerContainer className="flex min-w-max items-center gap-2 lg:min-w-0 lg:justify-between">
            {flowKeys.map((key, index) => (
              <StaggerItem key={key} className="flex items-center gap-2">
                <GlassCard className="group min-w-[120px] p-4 text-center transition-all group-hover:border-nexum-primary/50">
                  <span className="font-mono text-[10px] text-nexum-text-soft">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-nexum-text">{t(`flow.${key}`)}</p>
                </GlassCard>
                {index < flowKeys.length - 1 && (
                  <ArrowRight
                    className="hidden h-4 w-4 shrink-0 text-nexum-primary/50 lg:block"
                    aria-hidden="true"
                  />
                )}
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        <FadeIn delay={0.3}>
          <div className="mx-auto mt-8 h-1 max-w-2xl overflow-hidden rounded-full bg-nexum-border">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-nexum-primary to-nexum-secondary" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
