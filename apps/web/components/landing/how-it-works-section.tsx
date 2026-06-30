"use client";

import { FadeIn, StaggerContainer, StaggerItem } from "@/components/landing/ui/fade-in";
import { SectionHeading } from "@/components/landing/ui/section-heading";
import { useTranslations } from "next-intl";

const stepKeys = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"] as const;

export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");

  return (
    <section id="como-funciona" className="border-t border-nexum-border/40 bg-nexum-bg-soft/40 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div className="relative mt-16">
          <div
            className="absolute left-4 top-0 bottom-0 w-px section-journey-line lg:left-1/2 lg:-translate-x-1/2"
            aria-hidden="true"
          />

          <StaggerContainer className="space-y-8" stagger={0.1}>
            {stepKeys.map((key, index) => (
              <StaggerItem
                key={key}
                className={`relative flex items-center gap-6 ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                <div
                  className={`flex-1 ${index % 2 === 0 ? "lg:text-right" : "lg:text-left"} pl-12 lg:pl-0`}
                >
                  <FadeIn direction={index % 2 === 0 ? "right" : "left"}>
                    <div className="glass inline-block rounded-xl px-5 py-4">
                      <span className="font-mono text-xs text-nexum-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="mt-1 text-sm font-semibold text-nexum-text">{t(`steps.${key}`)}</p>
                    </div>
                  </FadeIn>
                </div>

                <div className="absolute left-4 flex h-3 w-3 -translate-x-1/2 items-center justify-center rounded-full border-2 border-nexum-primary bg-nexum-bg lg:left-1/2">
                  <span className="h-1.5 w-1.5 rounded-full bg-nexum-primary pulse-dot" />
                </div>

                <div className="hidden flex-1 lg:block" />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
