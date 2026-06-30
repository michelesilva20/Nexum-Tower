"use client";

import { LoginBackground } from "@/components/auth/login-background";
import { LoginForm } from "@/components/auth/login-form";
import { LoginVisualPanel } from "@/components/auth/login-visual-panel";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SectionBadge } from "@/components/landing/ui/section-badge";
import { NexumLogo } from "@/components/landing/ui/nexum-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function LoginPage() {
  const t = useTranslations("login.visual");
  const tForm = useTranslations("login.form");

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-nexum-bg">
      <LoginBackground />

      <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-nexum-border/50 bg-nexum-bg/80 px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <NexumLogo />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden text-sm text-nexum-text-muted transition-colors hover:text-nexum-text sm:inline"
          >
            ← {tForm("backHome")}
          </Link>
          <div className="flex items-center rounded-xl border border-nexum-border/50 bg-nexum-surface/30 px-1 py-1">
            <LocaleSwitcher />
            <span className="mx-0.5 h-4 w-px bg-nexum-border/50" aria-hidden="true" />
            <ThemeToggle compact />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
        <LoginVisualPanel />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-4 sm:px-8 lg:px-10 lg:py-6">
          <div className="mb-4 text-center lg:hidden">
            <SectionBadge pulse className="mb-3 normal-case tracking-normal">
              {t("badge")}
            </SectionBadge>
            <p className="text-lg font-semibold tracking-tight text-nexum-text">{t("titleMobile")}</p>
          </div>

          <div className="login-enter w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
