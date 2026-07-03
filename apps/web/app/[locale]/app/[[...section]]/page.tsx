import { AdminSectionRouter } from "@/components/app/admin-section-router";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string; section?: string[] }> };

const sectionSlugs = ["users", "roles", "groups", "permissions", "audit", "design-system"] as const;

export default async function AppSectionPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminSectionRouter />;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => [
    { locale },
    ...sectionSlugs.map((slug) => ({ locale, section: [slug] })),
  ]);
}
