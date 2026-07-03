"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      void refreshSession().then((ok) => {
        if (!ok) router.replace("/login");
      });
    }
  }, [isAuthenticated, isLoading, refreshSession, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-nexum-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-nexum-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
