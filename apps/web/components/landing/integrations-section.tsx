"use client";

import { FadeIn } from "@/components/landing/ui/fade-in";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { useTranslations } from "next-intl";

const integrationKeys = [
  "trackers",
  "erp",
  "tms",
  "wms",
  "bi",
  "whatsapp",
  "email",
  "api",
  "fiscal",
] as const;

export function IntegrationsSection() {
  const t = useTranslations("landing.integrations");

  return (
    <section id="integracoes" className="border-t border-nexum-border/40 bg-nexum-bg-soft/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <FadeIn>
          <div className="relative mx-auto mt-16 max-w-3xl">
            <svg
              viewBox="0 0 600 600"
              className="mx-auto h-[420px] w-full max-w-lg"
              aria-hidden="true"
            >
              {integrationKeys.map((_, i) => {
                const angle = (i / integrationKeys.length) * 2 * Math.PI - Math.PI / 2;
                const x = 300 + Math.cos(angle) * 220;
                const y = 300 + Math.sin(angle) * 220;
                return (
                  <line
                    key={i}
                    x1="300"
                    y1="300"
                    x2={x}
                    y2={y}
                    stroke="var(--nexum-primary)"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                    className="route-flow"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                );
              })}
            </svg>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <GlassCard strong hover={false} className="px-8 py-6 text-center">
                <p className="font-mono text-sm text-nexum-primary">{t("hub")}</p>
              </GlassCard>
            </div>

            {integrationKeys.map((key, i) => {
              const angle = (i / integrationKeys.length) * 2 * Math.PI - Math.PI / 2;
              const x = 50 + Math.cos(angle) * 42;
              const y = 50 + Math.sin(angle) * 42;
              return (
                <GlassCard
                  key={key}
                  hover={false}
                  className="absolute !rounded-lg px-3 py-2"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <p className="whitespace-nowrap font-mono text-[10px] text-nexum-text-muted">
                    {t(`items.${key}`)}
                  </p>
                </GlassCard>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
