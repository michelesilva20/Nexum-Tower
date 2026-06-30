"use client";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { GradientButton } from "@/components/landing/ui/gradient-button";
import { NexumLogo } from "@/components/landing/ui/nexum-logo";
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          ? "border-b border-nexum-border/60 bg-nexum-bg/90 shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl"
          : "border-b border-transparent bg-nexum-bg/40 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
        <NexumLogo />

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-sm text-nexum-text-muted transition-colors hover:text-nexum-text"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitcher />
          <ThemeToggle />
          <a
            href="#cta"
            className="hidden text-sm text-nexum-text-muted transition-colors hover:text-nexum-text lg:inline"
          >
            {t("login")}
          </a>
          <GradientButton href="#cta" icon className="!px-4 !py-2 text-sm">
            {t("demo")}
          </GradientButton>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LocaleSwitcher />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-nexum-border bg-nexum-surface text-nexum-text"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="border-t border-nexum-border/60 bg-nexum-bg/95 px-6 py-4 backdrop-blur-xl lg:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-nexum-text-muted"
              >
                {t(item.key)}
              </a>
            ))}
            <GradientButton href="#cta" className="mt-2 w-full">
              {t("demo")}
            </GradientButton>
          </div>
        </nav>
      )}
    </header>
  );
}
