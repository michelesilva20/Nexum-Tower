"use client";

import { GlassCard } from "@/components/landing/ui/glass-card";
import { useTranslations } from "next-intl";

export function LoginRouteMap() {
  const t = useTranslations("login.map");

  return (
    <GlassCard hover={false} className="relative mt-6 h-44 overflow-hidden p-4">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <svg viewBox="0 0 400 160" className="relative h-full w-full" aria-hidden="true">
        <path
          d="M 40 120 Q 120 40 200 80 T 360 60"
          fill="none"
          stroke="var(--nexum-primary)"
          strokeWidth="2"
          strokeOpacity="0.5"
          className="route-flow"
        />
        <circle cx="40" cy="120" r="5" fill="var(--nexum-secondary)" />
        <circle cx="200" cy="80" r="4" fill="var(--nexum-warning)" className="pulse-dot" />
        <circle cx="360" cy="60" r="5" fill="var(--nexum-primary)" />
        <circle cx="280" cy="70" r="3" fill="var(--nexum-risk)" className="pulse-dot" />
      </svg>
      <span className="absolute bottom-3 left-4 font-mono text-[10px] text-nexum-secondary">
        {t("origin")}
      </span>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 font-mono text-[10px] text-nexum-warning">
        {t("stop")}
      </span>
      <span className="absolute bottom-3 right-4 font-mono text-[10px] text-nexum-primary">
        {t("dest")}
      </span>
      <span className="absolute top-8 right-16 rounded-full border border-nexum-risk/40 bg-nexum-risk/10 px-2 py-0.5 font-mono text-[9px] text-nexum-risk">
        {t("alert")}
      </span>
    </GlassCard>
  );
}
