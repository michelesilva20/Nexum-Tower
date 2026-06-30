"use client";

import { AnimatedGrid } from "@/components/landing/ui/animated-grid";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/landing/ui/fade-in";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { GradientButton } from "@/components/landing/ui/gradient-button";
import { RouteLines } from "@/components/landing/ui/route-lines";
import { SectionBadge } from "@/components/landing/ui/section-badge";
import { MapPin, Radio } from "lucide-react";
import { useTranslations } from "next-intl";

const tagKeys = ["risk", "sla", "issue", "trip"] as const;
const metricKeys = ["trips", "onTime", "critical", "margin"] as const;

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section id="inicio" className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24">
      <AnimatedGrid opacity={0.25} />
      <RouteLines variant="hero" />
      <div className="absolute top-1/4 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full hero-glow-primary blur-3xl" />
      <div className="absolute top-1/3 right-0 h-[360px] w-[360px] rounded-full hero-glow-secondary blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <FadeIn>
              <SectionBadge pulse className="mb-6 normal-case tracking-normal">
                {t("badge")}
              </SectionBadge>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-nexum-text sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
                {t("title")}
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-nexum-text-muted">
                {t("subtitle")}
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <GradientButton href="#cta" icon>
                  {t("demo")}
                </GradientButton>
                <GradientButton href="#recursos" variant="secondary">
                  {t("resources")}
                </GradientButton>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.2} direction="left">
            <div className="relative">
              <div className="glow-primary float-soft rounded-2xl border border-nexum-border bg-nexum-surface/40 p-1 backdrop-blur-sm">
                <div className="rounded-xl bg-nexum-bg-soft/80 p-4">
                  <div className="mb-4 flex items-center gap-2 border-b border-nexum-border pb-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-nexum-danger/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-nexum-warning/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-nexum-success/80" />
                    <span className="ml-2 font-mono text-[10px] text-nexum-text-soft">
                      control-center.live
                    </span>
                  </div>

                  <StaggerContainer className="grid grid-cols-2 gap-3" stagger={0.06}>
                    {metricKeys.map((key) => (
                      <StaggerItem key={key}>
                        <GlassCard className="!rounded-xl p-3" hover={false}>
                          <p className="font-mono text-xl font-bold text-nexum-text">
                            {t(`values.${key}`)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-nexum-text-muted">
                            {t(`metrics.${key}`)}
                          </p>
                        </GlassCard>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>

                  <div className="relative mt-4 h-32 overflow-hidden rounded-xl border border-nexum-border bg-nexum-bg/60">
                    <RouteLines variant="hero" className="opacity-60" />
                    <MapPin className="absolute top-4 left-6 h-4 w-4 text-nexum-secondary" />
                    <MapPin className="absolute bottom-6 right-8 h-4 w-4 text-nexum-primary" />
                    <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-nexum-accent pulse-dot" />
                  </div>

                  <GlassCard className="mt-3 flex items-center justify-between !rounded-xl p-3" hover={false}>
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-nexum-risk" />
                      <span className="text-xs text-nexum-text-muted">{t("metrics.riskScore")}</span>
                    </div>
                    <span className="font-mono text-lg font-bold text-nexum-risk">
                      {t("values.riskScore")}
                    </span>
                  </GlassCard>
                </div>
              </div>

              {tagKeys.map((key, i) => (
                <span
                  key={key}
                  className={`absolute glass rounded-full px-3 py-1 font-mono text-[10px] text-nexum-primary ${
                    i === 0
                      ? "-top-3 -right-2"
                      : i === 1
                        ? "top-1/4 -left-4"
                        : i === 2
                          ? "bottom-1/3 -right-6"
                          : "bottom-4 left-4"
                  } float-soft`}
                  style={{ animationDelay: `${i * 0.8}s` }}
                >
                  {t(`tags.${key}`)}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
