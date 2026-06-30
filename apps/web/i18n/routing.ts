import { defaultLocale, locales } from "@nexum-tower/shared/i18n";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "as-needed",
});
