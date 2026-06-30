"use client";

import { GlassCard } from "@/components/landing/ui/glass-card";
import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";

const timelineKeys = ["t1", "t2", "t3", "t4"] as const;

export function LoginTimeline() {
  const t = useTranslations("login.timeline");

  return (
    <GlassCard hover={false} className="mt-4 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-nexum-primary" />
        <span className="text-xs font-medium text-nexum-text-muted">Timeline operacional</span>
      </div>
      <ul className="space-y-2">
        {timelineKeys.map((key, i) => (
          <li key={key} className="flex items-start gap-2 text-xs text-nexum-text-muted">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                i === timelineKeys.length - 1 ? "bg-nexum-warning" : "bg-nexum-primary/60"
              }`}
            />
            {t(key)}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
