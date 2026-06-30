"use client";

import { FadeIn } from "@/components/landing/ui/fade-in";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { GradientButton } from "@/components/landing/ui/gradient-button";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

const reasonKeys = ["r1", "r2", "r3", "r4"] as const;

export function RiskScoreSection() {
  const t = useTranslations("landing.risk");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();

  return (
    <section id="risco" className="border-t border-nexum-border/40 bg-nexum-bg-soft/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <FadeIn>
          <div ref={ref}>
          <GlassCard strong className="mx-auto mt-16 max-w-2xl p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-nexum-text-muted">{t("trip")}</p>
                <p className="mt-1 text-lg font-semibold text-nexum-text">{t("score")}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-nexum-risk/40 bg-nexum-risk/10 px-3 py-1 font-mono text-xs text-nexum-risk">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("level")}
              </span>
            </div>

            <p className="mt-4 font-mono text-4xl font-bold text-nexum-risk">{t("scoreValue")}</p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-nexum-border">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-nexum-warning to-nexum-risk"
                initial={{ width: reduced ? "82%" : "0%" }}
                animate={inView ? { width: "82%" } : {}}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <h3 className="mt-8 text-sm font-semibold text-nexum-text">{t("reasonsTitle")}</h3>
            <ul className="mt-3 space-y-2">
              {reasonKeys.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-nexum-text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-nexum-risk" />
                  {t(`reasons.${key}`)}
                </li>
              ))}
            </ul>

            <p className="mt-6 rounded-lg border border-nexum-border/60 bg-nexum-bg-soft/80 p-4 text-sm leading-relaxed text-nexum-text-muted">
              {t("recommendation")}
            </p>

            <GradientButton href="#cta" variant="secondary" className="mt-6">
              {t("action")}
            </GradientButton>
          </GlassCard>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
