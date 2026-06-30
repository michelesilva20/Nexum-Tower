"use client";

import { FeatureCard } from "@/components/landing/ui/feature-card";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { StaggerContainer, StaggerItem } from "@/components/landing/ui/fade-in";
import { Building2, KeyRound, Plug, Shield, UserCircle, Users } from "lucide-react";
import { useTranslations } from "next-intl";

const securityKeys = [
  { key: "multi", icon: Building2 },
  { key: "profiles", icon: UserCircle },
  { key: "permissions", icon: KeyRound },
  { key: "portal", icon: Users },
  { key: "audit", icon: Shield },
  { key: "integrations", icon: Plug },
] as const;

export function SecuritySection() {
  const t = useTranslations("landing.security");

  return (
    <section id="seguranca" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <StaggerContainer className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
          {securityKeys.map(({ key, icon }) => (
            <StaggerItem key={key}>
              <FeatureCard icon={icon} title={t(`items.${key}`)} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
