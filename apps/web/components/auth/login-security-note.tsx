"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";

export function LoginSecurityNote() {
  const t = useTranslations("login.security");

  return (
    <div className="mt-6 rounded-xl border border-nexum-border/50 bg-nexum-surface/30 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nexum-primary/10">
          <Shield className="h-4 w-4 text-nexum-primary" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-medium text-nexum-text">{t("title")}</p>
          <p className="mt-1 text-xs leading-relaxed text-nexum-text-muted">{t("description")}</p>
        </div>
      </div>
    </div>
  );
}
