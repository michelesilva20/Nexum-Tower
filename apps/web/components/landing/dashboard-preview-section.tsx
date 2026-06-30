"use client";

import { FadeIn } from "@/components/landing/ui/fade-in";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { useTranslations } from "next-intl";

const metricKeys = ["trips", "onTime", "issues", "risk", "margin", "idle"] as const;
const issueKeys = ["i1", "i2", "i3"] as const;
const criticalKeys = ["t1", "t2"] as const;
const barHeights = [65, 82, 74, 91, 88, 94, 96];

export function DashboardPreviewSection() {
  const t = useTranslations("landing.dashboard");
  const tCommon = useTranslations("common");

  return (
    <section id="dashboard" className="border-t border-nexum-border/40 bg-nexum-bg-soft/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <FadeIn>
          <GlassCard strong className="mt-16 overflow-hidden p-6 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-3">
                {metricKeys.map((key) => (
                  <div
                    key={key}
                    className="rounded-xl border border-nexum-border/60 bg-nexum-bg-soft/80 p-4"
                  >
                    <p className="font-mono text-2xl font-bold text-nexum-text">
                      {t(`metrics.${key}.value`)}
                    </p>
                    <p className="mt-1 text-xs text-nexum-text-muted">{t(`metrics.${key}.label`)}</p>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4">
                <p className="text-sm font-medium text-nexum-text">{t("criticalTrips")}</p>
                <div className="mt-3 space-y-2">
                  {criticalKeys.map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg border border-nexum-border/60 bg-nexum-bg-soft/60 px-3 py-2"
                    >
                      <div>
                        <p className="font-mono text-xs text-nexum-text">
                          {t(`criticalList.${key}.id`)}
                        </p>
                        <p className="text-[11px] text-nexum-text-soft">
                          {t(`criticalList.${key}.route`)}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-nexum-risk">
                        {t(`criticalList.${key}.risk`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5">
                <p className="text-sm font-medium text-nexum-text">{t("chartTitle")}</p>
                <div className="mt-4 flex h-36 items-end gap-2">
                  {barHeights.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-nexum-primary/30 to-nexum-primary"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center lg:col-span-2">
                <div
                  className="relative h-28 w-28 rounded-full border-4 border-nexum-border"
                  style={{
                    background: `conic-gradient(var(--nexum-success) 0 94.8%, var(--nexum-border) 94.8% 100%)`,
                  }}
                  aria-hidden="true"
                >
                  <div className="absolute inset-2 flex items-center justify-center rounded-full bg-nexum-surface">
                    <span className="font-mono text-sm font-bold text-nexum-success">94,8%</span>
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-nexum-text-muted">SLA</p>
              </div>

              <div className="lg:col-span-5">
                <p className="text-sm font-medium text-nexum-text">{t("recentIssues")}</p>
                <div className="mt-3 overflow-hidden rounded-xl border border-nexum-border/60">
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {issueKeys.map((key) => (
                        <tr key={key} className="border-b border-nexum-border/40 last:border-0">
                          <td className="px-3 py-2 font-mono text-nexum-text">
                            {t(`issuesTable.${key}.id`)}
                          </td>
                          <td className="px-3 py-2 text-nexum-text-muted">
                            {t(`issuesTable.${key}.type`)}
                          </td>
                          <td className="px-3 py-2 text-nexum-warning">
                            {t(`issuesTable.${key}.status`)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-nexum-text-soft">
              {tCommon("demoLabel")}
            </p>
          </GlassCard>
        </FadeIn>
      </div>
    </section>
  );
}
