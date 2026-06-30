"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const t = useTranslations("common.theme");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={t("toggle")}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-nexum-border bg-nexum-surface"
      />
    );
  }

  const isDark = theme === "dark" || resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("light") : t("dark")}
      title={isDark ? t("lightShort") : t("darkShort")}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-nexum-border bg-nexum-surface text-nexum-text-muted transition-colors hover:border-nexum-primary/40 hover:bg-nexum-surface-hover hover:text-nexum-text"
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
