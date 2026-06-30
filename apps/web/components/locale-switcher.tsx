"use client";

import { localeLabels, locales, type Locale } from "@nexum-tower/shared/i18n";
import { cn } from "@nexum-tower/ui";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

type LocaleSwitcherProps = {
  className?: string;
};

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const t = useTranslations("common.locale");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(nextLocale: string) {
    if (nextLocale === locale) return;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale as Locale });
    });
  }

  return (
    <div className={cn("relative", className)}>
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        aria-label={t("label")}
        className="h-8 min-w-[5.5rem] cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent py-1 pl-2.5 pr-8 text-xs font-medium text-nexum-text-muted outline-none transition-colors hover:border-nexum-border/60 hover:bg-nexum-surface/50 hover:text-nexum-text focus-visible:border-nexum-primary/40 focus-visible:bg-nexum-surface/60 focus-visible:text-nexum-text disabled:cursor-wait disabled:opacity-60"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nexum-text-soft"
        aria-hidden="true"
      />
    </div>
  );
}
