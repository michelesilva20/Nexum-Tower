"use client";

import { FadeIn } from "@/components/landing/ui/fade-in";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const questionKeys = ["q1", "q2", "q3", "q4", "q5"] as const;
const chipKeys = ["sla", "costs", "issues", "trips", "clients"] as const;

export function AiSection() {
  const t = useTranslations("landing.ai");
  const fullResponse = t("response");
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      setDisplayed(fullResponse.slice(0, i));
      if (i >= fullResponse.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [started, fullResponse]);

  return (
    <section id="ai" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <FadeIn>
            <div className="space-y-2">
              {questionKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setStarted(true);
                    setDisplayed("");
                  }}
                  className="w-full rounded-xl border border-nexum-border bg-nexum-surface/60 px-4 py-3 text-left text-sm text-nexum-text-muted transition-colors hover:border-nexum-primary/40 hover:text-nexum-text"
                >
                  {t(`questions.${key}`)}
                </button>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.15} direction="left">
            <GlassCard strong className="flex h-full flex-col p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-nexum-primary" />
                <span className="text-sm font-medium text-nexum-text">Nexum AI</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {chipKeys.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-nexum-border px-2.5 py-0.5 font-mono text-[10px] text-nexum-primary"
                  >
                    {t(`chips.${key}`)}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex-1 rounded-xl border border-nexum-border/60 bg-nexum-bg-soft/80 p-4">
                <p className="text-sm leading-relaxed text-nexum-text-muted">
                  {started ? displayed : fullResponse}
                  {started && displayed.length < fullResponse.length && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-nexum-primary" />
                  )}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-nexum-border bg-nexum-bg/60 px-4 py-3 text-sm text-nexum-text-soft">
                {t("placeholder")}
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
