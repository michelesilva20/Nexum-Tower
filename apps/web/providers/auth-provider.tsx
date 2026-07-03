"use client";

import { isPublicAuthPath } from "@/lib/public-routes";
import { loginRequest, logoutRequest, refreshRequest } from "@/lib/auth";
import type { AuthUser } from "@nexum-tower/shared";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => !isPublicAuthPath(pathname));
  const bootstrapped = useRef(false);

  const refreshSession = useCallback(async () => {
    const nextUser = await refreshRequest();
    setUser(nextUser);
    return !!nextUser;
  }, []);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const publicRoute = isPublicAuthPath(pathname);

    if (publicRoute) {
      void refreshSession();
      return;
    }

    void refreshSession().finally(() => setIsLoading(false));
  }, [pathname, refreshSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const nextUser = await loginRequest(email, password);
      setUser(nextUser);
      router.push("/app");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // clear local state even if API fails
    }
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshSession,
    }),
    [user, isLoading, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
