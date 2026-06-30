"use client";

import { FeatureCard } from "@/components/landing/ui/feature-card";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { StaggerContainer, StaggerItem } from "@/components/landing/ui/fade-in";
import {
  BarChart3,
  Brain,
  FileCheck,
  LayoutDashboard,
  Package,
  Route,
  Users,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";

const moduleKeys = [
  { key: "tower", icon: LayoutDashboard, num: "01" },
  { key: "trips", icon: Route, num: "02" },
  { key: "issues", icon: Package, num: "03" },
  { key: "costs", icon: Wallet, num: "04" },
  { key: "proofs", icon: FileCheck, num: "05" },
  { key: "ai", icon: Brain, num: "06" },
  { key: "portal", icon: Users, num: "07" },
  { key: "reports", icon: BarChart3, num: "08" },
] as const;

export function ModulesSection() {
  const t = useTranslations("landing.modules");

  return (
    <section id="recursos" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <StaggerContainer
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.05}
        >
          {moduleKeys.map(({ key, icon, num }) => (
            <StaggerItem key={key}>
              <FeatureCard
                number={num}
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
