"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppSidebar, useSidebarMobile } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { NexumToastProvider } from "@/components/ui/nexum/nexum-toast";
import { allNavHrefs } from "@/lib/navigation";
import { useRouter } from "@/i18n/navigation";
import { useEffect, type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { mobileOpen, openMobile, closeMobile } = useSidebarMobile();

  useEffect(() => {
    for (const href of allNavHrefs) {
      router.prefetch(href);
    }
    router.prefetch("/app/design-system");
  }, [router]);

  return (
    <ProtectedRoute>
      <NexumToastProvider>
        <div className="relative flex min-h-screen bg-nexum-bg">
          <div
            className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.15]"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 app-shell-bg" aria-hidden="true" />

          <AppSidebar mobileOpen={mobileOpen} onMobileClose={closeMobile} />

          <div className="relative z-10 flex min-h-svh min-w-0 flex-1 flex-col lg:pl-[240px]">
            <AppTopbar onMenuClick={openMobile} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </NexumToastProvider>
    </ProtectedRoute>
  );
}
