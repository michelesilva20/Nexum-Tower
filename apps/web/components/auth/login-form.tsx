"use client";

import { PasswordInput } from "@/components/auth/password-input";
import { GlassCard } from "@/components/landing/ui/glass-card";
import { NexumLogo } from "@/components/landing/ui/nexum-logo";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Link } from "@/i18n/navigation";
import { cn } from "@nexum-tower/ui";
import { ArrowRight, Loader2, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";

type FormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export function LoginForm() {
  const t = useTranslations("login.form");
  const tErrors = useTranslations("login.errors");
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!email.trim()) next.email = tErrors("email");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = tErrors("emailInvalid");
    if (!password) next.password = tErrors("password");
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    setErrors({});

    try {
      await login(email.trim(), password);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setErrors({ form: tErrors("invalidCredentials") });
      } else {
        setErrors({ form: tErrors("generic") });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard strong hover={false} className="glow-primary overflow-hidden p-0">
      <div className="h-1 bg-gradient-to-r from-nexum-primary via-nexum-secondary to-nexum-accent" />

      <div className="p-6 sm:p-7">
        <div className="hidden lg:block">
          <NexumLogo showText={false} size="lg" />
        </div>

        <h1 className="mt-0 text-xl font-bold tracking-tight text-nexum-text lg:mt-4 lg:text-2xl">
          {t("title")}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-nexum-text-muted">{t("subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {errors.form && (
            <p className="rounded-xl border border-nexum-danger/30 bg-nexum-danger/5 px-3 py-2 text-sm text-nexum-danger" role="alert">
              {errors.form}
            </p>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-nexum-text">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={cn(
                "w-full rounded-xl border bg-nexum-bg-soft/60 px-3.5 py-2.5 text-sm text-nexum-text placeholder:text-nexum-text-soft outline-none transition-colors",
                errors.email
                  ? "border-nexum-danger/60 focus:border-nexum-danger focus:ring-2 focus:ring-nexum-danger/20"
                  : "border-nexum-border focus:border-nexum-primary/60 focus:ring-2 focus:ring-nexum-primary/20",
              )}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-nexum-danger" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <PasswordInput
            id="password"
            label={t("password")}
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
            error={errors.password}
            showToggleLabel={t("showPassword")}
            hideToggleLabel={t("hidePassword")}
          />

          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-nexum-text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-nexum-border bg-nexum-bg-soft accent-nexum-primary"
              />
              {t("remember")}
            </label>
            <button
              type="button"
              className="text-sm text-nexum-primary transition-colors hover:text-nexum-secondary"
            >
              {t("forgot")}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-nexum-primary-foreground shadow-[0_4px_24px_rgba(34,211,238,0.2)] transition-all hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexum-primary disabled:cursor-wait disabled:opacity-80"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t("submitting")}
              </>
            ) : (
              <>
                {t("submit")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-nexum-text-soft">
          <Shield className="h-3.5 w-3.5 shrink-0 text-nexum-primary/70" aria-hidden="true" />
          <span>{t("securityLine")}</span>
        </div>

        <p className="mt-3 text-center text-xs text-nexum-text-soft">
          {t("noAccess")}{" "}
          <Link href="/#cta" className="font-medium text-nexum-primary hover:text-nexum-secondary">
            {t("demo")}
          </Link>
          <span className="mx-2 text-nexum-border">·</span>
          <button type="button" className="text-nexum-text-muted transition-colors hover:text-nexum-text">
            {t("sso")}
          </button>
        </p>
      </div>
    </GlassCard>
  );
}
