"use client";

import { FadeIn, StaggerContainer, StaggerItem } from "@/components/landing/ui/fade-in";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { RouteLines } from "@/components/landing/ui/route-lines";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import {
  Clock,
  FileQuestion,
  MessageSquare,
  Receipt,
  Split,
  Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";

const painKeys = [
  { key: "visibility", icon: Truck },
  { key: "history", icon: FileQuestion },
  { key: "costs", icon: Receipt },
  { key: "status", icon: MessageSquare },
  { key: "delays", icon: Clock },
  { key: "decisions", icon: Split },
] as const;

export function PainPointsSection() {
  const t = useTranslations("landing.pain");

  return (
    <section id="problema" className="relative border-t border-nexum-border/40 py-20 lg:py-28">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        className="px-6 lg:px-8"
      />

      <StaggerContainer
        className="relative mx-auto mt-16 grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3 lg:px-8"
        stagger={0.07}
      >
        {painKeys.map(({ key, icon: Icon }, index) => (
          <StaggerItem
            key={key}
            className={index % 3 === 1 ? "lg:translate-y-4" : index % 3 === 2 ? "lg:-translate-y-2" : ""}
          >
            <GlassCard className="h-full p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-nexum-border bg-nexum-bg-soft">
                <Icon className="h-4 w-4 text-nexum-text-soft" strokeWidth={1.75} />
              </div>
              <p className="mt-4 text-sm font-medium leading-relaxed text-nexum-text-muted">
                {t(`items.${key}`)}
              </p>
            </GlassCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeIn className="mx-auto mt-12 max-w-3xl px-6">
        <RouteLines />
        <p className="mt-4 text-center font-mono text-xs text-nexum-text-soft">
          → {t("connecting")}
        </p>
      </FadeIn>
    </section>
  );
}
