import { defaultLocale, locales } from "@nexum-tower/shared";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "as-needed",
});
