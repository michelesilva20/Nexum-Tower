"use client";

import { GlassCard } from "@/components/landing/ui/glass-card";
import { RouteLines } from "@/components/landing/ui/route-lines";
import { MapPin, Radio } from "lucide-react";
import { useTranslations } from "next-intl";

const metricKeys = ["trips", "onTime"] as const;
const tagKeys = ["risk", "sla", "trip"] as const;

const tagPositions = [
  "-top-2 -right-1 login-float-delay-1",
  "top-1/3 -left-3 login-float-delay-2",
  "bottom-6 -right-4 login-float-delay-3",
] as const;

export function LoginCommandPreview() {
  const t = useTranslations("landing.hero");
  const tVisual = useTranslations("login.visual");

  return (
    <div className="relative mt-8 max-w-md xl:max-w-lg">
      <div className="glow-primary login-float-soft rounded-2xl border border-nexum-border bg-nexum-surface/40 p-1 backdrop-blur-sm">
        <div className="rounded-xl bg-nexum-bg-soft/80 p-3.5 sm:p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-nexum-border pb-2.5">
            <div className="h-2 w-2 rounded-full bg-nexum-danger/80" />
            <div className="h-2 w-2 rounded-full bg-nexum-warning/80" />
            <div className="h-2 w-2 rounded-full bg-nexum-success/80" />
            <span className="ml-1.5 font-mono text-[10px] text-nexum-text-soft">
              {tVisual("previewLabel")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {metricKeys.map((key) => (
              <GlassCard key={key} className="!rounded-xl p-2.5" hover={false}>
                <p className="font-mono text-lg font-bold text-nexum-text">{t(`values.${key}`)}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-nexum-text-muted">
                  {t(`metrics.${key}`)}
                </p>
              </GlassCard>
            ))}
          </div>

          <div className="relative mt-2.5 h-24 overflow-hidden rounded-xl border border-nexum-border bg-nexum-bg/60">
            <RouteLines variant="hero" className="opacity-50" />
            <MapPin className="absolute top-3 left-5 h-3.5 w-3.5 text-nexum-secondary" />
            <MapPin className="absolute bottom-4 right-6 h-3.5 w-3.5 text-nexum-primary" />
            <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-nexum-accent pulse-dot" />
          </div>

          <GlassCard className="mt-2.5 flex items-center justify-between !rounded-xl p-2.5" hover={false}>
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-nexum-risk" />
              <span className="text-[10px] text-nexum-text-muted">{t("metrics.riskScore")}</span>
            </div>
            <span className="font-mono text-base font-bold text-nexum-risk">{t("values.riskScore")}</span>
          </GlassCard>
        </div>
      </div>

      {tagKeys.map((key, i) => (
        <span
          key={key}
          className={`absolute glass rounded-full px-2.5 py-1 font-mono text-[9px] text-nexum-primary login-float-soft ${tagPositions[i]}`}
        >
          {t(`tags.${key}`)}
        </span>
      ))}
    </div>
  );
}
