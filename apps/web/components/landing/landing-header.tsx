"use client";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { GradientButton } from "@/components/landing/ui/gradient-button";
import { NexumLogo } from "@/components/landing/ui/nexum-logo";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@nexum-tower/ui";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const navItems = [
  { key: "product", href: "#solucao" },
  { key: "solutions", href: "#solucao" },
  { key: "resources", href: "#recursos" },
  { key: "howItWorks", href: "#como-funciona" },
  { key: "faq", href: "#faq" },
] as const;

export function LandingHeader() {
  const t = useTranslations("landing.header");
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    router.prefetch("/login");
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-nexum-border/60 bg-nexum-bg/90 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl"
          : "border-b border-transparent bg-nexum-bg/40 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-6 lg:px-8">
        <NexumLogo />

        <nav
          className="hidden flex-1 items-center justify-center gap-8 xl:gap-10 lg:flex"
          aria-label="Main"
        >
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="whitespace-nowrap text-sm text-nexum-text-muted transition-colors hover:text-nexum-text"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center lg:flex">
          <div className="flex items-center gap-1 rounded-xl border border-nexum-border/50 bg-nexum-surface/30 px-1 py-1">
            <LocaleSwitcher />
            <span className="mx-0.5 h-4 w-px bg-nexum-border/50" aria-hidden="true" />
            <ThemeToggle compact />
          </div>

          <span className="mx-4 h-5 w-px bg-nexum-border/40" aria-hidden="true" />

          <Link
            href="/login"
            prefetch
            className="mr-4 whitespace-nowrap text-sm font-medium text-nexum-text-muted transition-colors hover:text-nexum-text"
          >
            {t("login")}
          </Link>

          <GradientButton href="#cta" icon className="!px-5 !py-2.5 text-sm">
            {t("demo")}
          </GradientButton>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex items-center rounded-xl border border-nexum-border/50 bg-nexum-surface/30 px-0.5 py-0.5">
            <LocaleSwitcher />
            <span className="h-4 w-px bg-nexum-border/50" aria-hidden="true" />
            <ThemeToggle compact />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-nexum-border/60 bg-nexum-surface/60 text-nexum-text"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="border-t border-nexum-border/60 bg-nexum-bg/95 px-5 py-5 backdrop-blur-xl lg:hidden sm:px-6"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-nexum-text-muted transition-colors hover:bg-nexum-surface/60 hover:text-nexum-text"
              >
                {t(item.key)}
              </a>
            ))}
          </div>
          <div className="mt-4 space-y-3 border-t border-nexum-border/40 pt-4">
            <Link
              href="/login"
              prefetch
              onClick={() => setMobileOpen(false)}
              className="block px-3 text-sm font-medium text-nexum-text-muted"
            >
              {t("login")}
            </Link>
            <GradientButton href="#cta" className="w-full" icon onClick={() => setMobileOpen(false)}>
              {t("demo")}
            </GradientButton>
          </div>
        </nav>
      )}
    </header>
  );
}
