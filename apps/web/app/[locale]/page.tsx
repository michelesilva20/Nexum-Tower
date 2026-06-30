import { LandingPage } from "@/components/landing/landing-page";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LandingPage />;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
