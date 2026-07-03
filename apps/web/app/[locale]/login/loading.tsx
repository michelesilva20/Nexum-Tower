import { NexumLogo } from "@/components/landing/ui/nexum-logo";

export default function LoginLoading() {
  return (
    <div className="flex h-[100dvh] flex-col bg-nexum-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-nexum-border/50 px-5 py-3.5 sm:px-8">
        <NexumLogo />
        <div className="h-9 w-24 animate-pulse rounded-xl bg-nexum-surface/40" />
      </header>
      <main className="flex flex-1 items-center justify-center px-5">
        <div className="w-full max-w-md space-y-4">
          <div className="mx-auto h-8 w-40 animate-pulse rounded-lg bg-nexum-surface/50" />
          <div className="h-64 animate-pulse rounded-2xl border border-nexum-border/40 bg-nexum-surface/30" />
        </div>
      </main>
    </div>
  );
}
