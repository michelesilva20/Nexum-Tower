import { AccessDeniedPage } from "@/components/auth/access-denied-page";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "accessDenied.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default async function AccessDeniedRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AccessDeniedPage />;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
