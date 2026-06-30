import { NexumLogo } from "@/components/landing/ui/nexum-logo";
import { getTranslations } from "next-intl/server";

const productLinks = ["tower", "trips", "issues", "costs", "ai"] as const;
const companyLinks = ["about", "security", "contact"] as const;
const resourceLinks = ["blog", "docs", "status"] as const;
const legalLinks = ["privacy", "terms"] as const;

export async function LandingFooter() {
  const t = await getTranslations("landing.footer");

  const columns = [
    { title: t("product"), keys: productLinks },
    { title: t("company"), keys: companyLinks },
    { title: t("resources"), keys: resourceLinks },
    { title: t("legal"), keys: legalLinks },
  ] as const;

  return (
    <footer className="border-t border-nexum-border/60 bg-nexum-bg-soft/60 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <NexumLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-nexum-text-soft">
              {t("tagline")}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-nexum-text">{col.title}</h3>
              <ul className="mt-4 space-y-2">
                {col.keys.map((key) => (
                  <li key={key}>
                    <a
                      href="#recursos"
                      className="text-sm text-nexum-text-muted transition-colors hover:text-nexum-primary"
                    >
                      {t(`links.${key}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-nexum-border/40 pt-8 text-center font-mono text-xs text-nexum-text-soft">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
