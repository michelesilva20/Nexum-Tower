import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@nexum-tower/ui", "@nexum-tower/shared"],
  serverExternalPackages: ["zod"],
};

export default withNextIntl(nextConfig);
