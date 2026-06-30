"use client";

import { FadeIn } from "@/components/landing/ui/fade-in";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

const benefitKeys = ["b1", "b2", "b3", "b4", "b5", "b6", "b7"] as const;
const metricKeys = ["m1", "m2", "m3", "m4"] as const;

export function BenefitsSection() {
  const t = useTranslations("landing.benefits");
  const tCommon = useTranslations("common");

  return (
    <section id="beneficios" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            align="left"
            className="!mx-0"
          />

          <FadeIn direction="left">
            <ul className="space-y-3">
              {benefitKeys.map((key) => (
                <li key={key} className="flex items-start gap-3 text-sm text-nexum-text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-nexum-secondary" strokeWidth={2} />
                  {t(`items.${key}`)}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricKeys.map((key) => (
            <GlassCard key={key} className="p-6 text-center">
              <p className="font-mono text-3xl font-bold gradient-text">{t(`metrics.${key}.value`)}</p>
              <p className="mt-2 text-sm text-nexum-text-muted">{t(`metrics.${key}.label`)}</p>
              <p className="mt-3 font-mono text-[10px] uppercase text-nexum-text-soft">
                {tCommon("demoLabel")}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
