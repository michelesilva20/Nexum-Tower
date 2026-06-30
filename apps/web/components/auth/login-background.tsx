"use client";

import { AnimatedGrid } from "@/components/landing/ui/animated-grid";
import { RouteLines } from "@/components/landing/ui/route-lines";

export function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-nexum-bg via-nexum-bg-soft to-nexum-bg" />
      <AnimatedGrid opacity={0.22} />
      <RouteLines variant="hero" className="opacity-35" />
      <div className="absolute top-1/4 left-1/3 h-[420px] w-[560px] -translate-x-1/2 rounded-full hero-glow-primary blur-3xl" />
      <div className="absolute bottom-1/4 right-0 h-[320px] w-[320px] rounded-full hero-glow-secondary blur-3xl" />
    </div>
  );
}
