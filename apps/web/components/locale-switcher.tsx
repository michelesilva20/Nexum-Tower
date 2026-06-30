"use client";

import { localeLabels, locales, type Locale } from "@nexum-tower/shared";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

export function LocaleSwitcher() {
  const t = useTranslations("common.locale");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(nextLocale: Locale) {
    if (nextLocale === locale) return;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center rounded-lg border border-nexum-border bg-nexum-surface p-0.5"
    >
      {locales.map((code) => {
        const isActive = code === locale;

        return (
          <button
            key={code}
            type="button"
            onClick={() => handleChange(code)}
            disabled={isPending}
            aria-label={`${t("switch")}: ${localeLabels[code]}`}
            aria-pressed={isActive}
            className={`min-w-[2.25rem] rounded-md px-2 py-1.5 font-mono text-xs font-medium transition-colors ${
              isActive
                ? "bg-nexum-primary text-nexum-primary-foreground"
                : "text-nexum-text-muted hover:text-nexum-text"
            }`}
          >
            {localeLabels[code]}
          </button>
        );
      })}
    </div>
  );
}
