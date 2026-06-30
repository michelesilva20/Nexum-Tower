"use client";

import { SectionHeading } from "@/components/landing/ui/section-heading";
import { cn } from "@nexum-tower/ui";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;

export function FaqSection() {
  const t = useTranslations("landing.faq");
  const [open, setOpen] = useState<string | null>("q1");

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div className="mt-12 space-y-3">
          {faqKeys.map((key) => {
            const isOpen = open === key;
            return (
              <div
                key={key}
                className="overflow-hidden rounded-xl border border-nexum-border bg-nexum-surface/60"
              >
                <button
                  type="button"
                  id={`faq-${key}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${key}`}
                  onClick={() => setOpen(isOpen ? null : key)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-nexum-text transition-colors hover:text-nexum-primary"
                >
                  {t(`items.${key}.q`)}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-nexum-text-muted transition-transform",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`faq-panel-${key}`}
                  role="region"
                  aria-labelledby={`faq-${key}`}
                  hidden={!isOpen}
                  className="border-t border-nexum-border/60 px-5 py-4 text-sm leading-relaxed text-nexum-text-muted"
                >
                  {t(`items.${key}.a`)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
