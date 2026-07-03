"use client";

/** Lightweight CSS-only backdrop — avoids pulling RouteLines/AnimatedGrid into the login chunk. */
export function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-nexum-bg via-nexum-bg-soft to-nexum-bg" />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(var(--nexum-border) 1px, transparent 1px), linear-gradient(90deg, var(--nexum-border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute top-1/4 left-1/3 h-[420px] w-[560px] -translate-x-1/2 rounded-full hero-glow-primary blur-3xl" />
      <div className="absolute bottom-1/4 right-0 h-[320px] w-[320px] rounded-full hero-glow-secondary blur-3xl" />
    </div>
  );
}
