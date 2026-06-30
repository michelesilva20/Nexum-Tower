"use client";

import { AnimatedGrid } from "@/components/landing/ui/animated-grid";
import { FadeIn } from "@/components/landing/ui/fade-in";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { GradientButton } from "@/components/landing/ui/gradient-button";
import { RouteLines } from "@/components/landing/ui/route-lines";
import { useTranslations } from "next-intl";

export function FinalCtaSection() {
  const t = useTranslations("landing.cta");

  return (
    <section id="cta" className="relative overflow-hidden py-24 lg:py-32">
      <AnimatedGrid opacity={0.2} />
      <RouteLines variant="hero" />
      <div className="absolute inset-0 bg-gradient-to-b from-nexum-primary/5 via-transparent to-nexum-secondary/5" />

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        <FadeIn>
          <GlassCard strong className="glow-primary p-10 lg:p-14">
            <h2 className="text-3xl font-bold tracking-tight text-nexum-text sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-nexum-text-muted">{t("subtitle")}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <GradientButton href="#cta" icon>
                {t("demo")}
              </GradientButton>
              <GradientButton href="#recursos" variant="secondary">
                {t("resources")}
              </GradientButton>
            </div>
          </GlassCard>
        </FadeIn>
      </div>
    </section>
  );
}
