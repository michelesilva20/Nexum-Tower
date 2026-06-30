"use client";

import { LoginCommandPreview } from "@/components/auth/login-command-preview";
import { SectionBadge } from "@/components/landing/ui/section-badge";
import { useTranslations } from "next-intl";

export function LoginVisualPanel() {
  const t = useTranslations("login.visual");

  return (
    <div className="relative hidden min-h-0 flex-col justify-center px-8 lg:flex lg:w-[52%] xl:px-14">
      <SectionBadge pulse className="login-enter mb-5 w-fit normal-case tracking-normal">
        {t("badge")}
      </SectionBadge>

      <h2 className="login-enter login-enter-delay-1 max-w-lg text-3xl font-bold leading-[1.15] tracking-tight text-nexum-text xl:text-4xl">
        {t("title")}
      </h2>

      <p className="login-enter login-enter-delay-2 mt-4 max-w-md text-base leading-relaxed text-nexum-text-muted lg:text-lg">
        {t("subtitle")}
      </p>

      <div className="login-enter login-enter-delay-3">
        <LoginCommandPreview />
      </div>
    </div>
  );
}
