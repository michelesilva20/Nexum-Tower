import { LoginPage } from "@/components/auth/login-page";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
    alternates: { canonical: "/login" },
  };
}

export default async function LoginRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginPage />;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
