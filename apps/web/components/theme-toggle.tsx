"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@nexum-tower/ui";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
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
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-nexum-text-muted",
          !compact && "border border-nexum-border bg-nexum-surface",
        )}
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
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-nexum-text-muted transition-colors hover:bg-nexum-surface/60 hover:text-nexum-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-nexum-primary/40",
        !compact && "border border-nexum-border bg-nexum-surface hover:border-nexum-primary/40 hover:bg-nexum-surface-hover",
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
