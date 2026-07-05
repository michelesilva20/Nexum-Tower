"use client";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { NexumButton } from "@/components/ui/nexum/nexum-button";
import { NexumInput } from "@/components/ui/nexum/nexum-input";
import { NexumLogo } from "@/components/landing/ui/nexum-logo";
import { Brain, Bell, Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";

type AppTopbarProps = {
  onMenuClick?: () => void;
};

export function AppTopbar({ onMenuClick }: AppTopbarProps) {
  const t = useTranslations("admin.topbar");

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-nexum-border/50 glass px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-xl border border-nexum-border/50 p-2 text-nexum-text-muted hover:bg-nexum-surface/50 lg:hidden"
        aria-label={t("openMenu")}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="lg:hidden">
        <NexumLogo showText={false} size="md" />
      </div>

      <div className="relative hidden min-w-0 flex-1 lg:block lg:max-w-md xl:max-w-lg">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexum-text-soft"
          aria-hidden="true"
        />
        <NexumInput
          type="search"
          placeholder={t("searchPlaceholderShort")}
          className="h-9 pl-10"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NexumButton
          variant="ghost"
          className="hidden h-9 w-9 p-0 xl:inline-flex"
          aria-label={t("nexumAi")}
        >
          <Brain className="h-4 w-4 text-nexum-primary" />
        </NexumButton>

        <NexumButton variant="ghost" className="h-9 w-9 p-0" aria-label={t("notifications")}>
          <Bell className="h-4 w-4" />
        </NexumButton>

        <div className="flex items-center rounded-xl border border-nexum-border/50 bg-nexum-surface/30 px-1 py-1">
          <LocaleSwitcher />
          <span className="mx-0.5 h-4 w-px bg-nexum-border/50" aria-hidden="true" />
          <ThemeToggle compact />
        </div>
      </div>
    </header>
  );
}
