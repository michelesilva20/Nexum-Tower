"use client";

import { FeatureCard } from "@/components/landing/ui/feature-card";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { StaggerContainer, StaggerItem } from "@/components/landing/ui/fade-in";
import { Building2, Headphones, Package, Truck, Warehouse } from "lucide-react";
import { useTranslations } from "next-intl";

const audienceKeys = [
  { key: "carriers", icon: Truck },
  { key: "operators", icon: Package },
  { key: "shippers", icon: Building2 },
  { key: "cd", icon: Warehouse },
  { key: "fleet", icon: Truck },
  { key: "cs", icon: Headphones },
] as const;

export function AudienceSection() {
  const t = useTranslations("landing.audience");

  return (
    <section id="publico" className="border-t border-nexum-border/40 bg-nexum-bg-soft/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <StaggerContainer className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
          {audienceKeys.map(({ key, icon }) => (
            <StaggerItem key={key}>
              <FeatureCard
                icon={icon}
                title={t(`items.${key}.title`)}
                description={t(`items.${key}.description`)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
