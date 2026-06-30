"use client";

import { AnimatedGrid } from "@/components/landing/ui/animated-grid";
import { FadeIn } from "@/components/landing/ui/fade-in";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { RouteLines } from "@/components/landing/ui/route-lines";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { useTranslations } from "next-intl";

const labelKeys = ["origin", "stop", "risk", "dest"] as const;

export function OperationalMapSection() {
  const t = useTranslations("landing.map");

  return (
    <section id="mapa" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <FadeIn>
          <div className="relative mt-16 aspect-[16/9] max-h-[520px] overflow-hidden rounded-2xl border border-nexum-border bg-nexum-bg-soft">
            <AnimatedGrid opacity={0.3} />
            <RouteLines variant="hero" />

            <svg
              viewBox="0 0 800 450"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <path
                d="M 80 320 Q 200 180 380 240 T 720 200"
                fill="none"
                stroke="var(--nexum-primary)"
                strokeWidth="2"
                strokeOpacity="0.5"
                className="route-flow"
              />
              <path
                d="M 120 380 Q 300 120 520 300 T 680 260"
                fill="none"
                stroke="var(--nexum-secondary)"
                strokeWidth="1.5"
                strokeOpacity="0.35"
                className="route-flow"
              />
              <circle cx="80" cy="320" r="6" fill="var(--nexum-secondary)" className="pulse-dot" />
              <circle cx="720" cy="200" r="6" fill="var(--nexum-primary)" className="pulse-dot" />
              <circle
                cx="380"
                cy="240"
                r="4"
                fill="var(--nexum-accent)"
                className="pulse-dot"
                style={{ animationDelay: "0.5s" }}
              />
            </svg>

            {labelKeys.map((key, i) => (
              <GlassCard
                key={key}
                hover={false}
                className={`absolute max-w-[160px] !rounded-lg px-3 py-2 ${
                  i === 0
                    ? "bottom-[18%] left-[6%]"
                    : i === 1
                      ? "top-[28%] left-[38%]"
                      : i === 2
                        ? "top-[22%] right-[22%]"
                        : "top-[38%] right-[8%]"
                }`}
              >
                <p className="font-mono text-[10px] text-nexum-primary">{t(`labels.${key}`)}</p>
              </GlassCard>
            ))}

            <div className="absolute bottom-4 left-4 flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-nexum-primary pulse-dot"
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
