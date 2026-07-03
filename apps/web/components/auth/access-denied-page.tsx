"use client";

import { useAuth } from "@/providers/auth-provider";
import { NexumButton } from "@/components/ui/nexum/nexum-button";
import { NexumCard } from "@/components/ui/nexum/nexum-card";
import { Link } from "@/i18n/navigation";
import { ShieldOff } from "lucide-react";
import { useTranslations } from "next-intl";
export function AccessDeniedPage() {
  const t = useTranslations("accessDenied");
  const { logout } = useAuth();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-nexum-bg px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-nexum-bg via-nexum-bg-soft to-nexum-bg" />

      <NexumCard variant="glass" padding="lg" className="relative z-10 w-full max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-nexum-danger/10">
          <ShieldOff className="h-7 w-7 text-nexum-danger" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-nexum-text">{t("title")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-nexum-text-muted">{t("description")}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/app">
            <NexumButton className="w-full sm:w-auto">{t("backToApp")}</NexumButton>
          </Link>
          <NexumButton variant="secondary" onClick={() => void logout()}>
            {t("logout")}
          </NexumButton>
        </div>
      </NexumCard>    </div>
  );
}
