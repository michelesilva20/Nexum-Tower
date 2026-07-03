"use client";

import { cn } from "@nexum-tower/ui";
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type NexumToastType = "success" | "error" | "warning" | "info" | "loading";

type Toast = {
  id: string;
  type: NexumToastType;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const iconMap = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const accentMap = {
  success: "border-l-nexum-success",
  error: "border-l-nexum-danger",
  warning: "border-l-nexum-warning",
  info: "border-l-nexum-accent",
  loading: "border-l-nexum-primary",
};

export function NexumToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((input: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...input, id }]);
    if (input.type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = iconMap[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto glass-strong flex gap-3 rounded-xl border-l-4 p-4 shadow-xl",
                accentMap[t.type],
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 text-nexum-text-muted",
                  t.type === "loading" && "animate-spin",
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-nexum-text">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-nexum-text-muted">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-nexum-text-soft hover:text-nexum-text"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useNexumToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useNexumToast must be used within NexumToastProvider");
  return ctx;
}

export function NexumToast({
  type,
  title,
  description,
  className,
}: Omit<Toast, "id"> & { className?: string }) {
  const Icon = iconMap[type];
  return (
    <div
      className={cn(
        "glass-strong flex gap-3 rounded-xl border-l-4 p-4",
        accentMap[type],
        className,
      )}
    >
      <Icon className="h-5 w-5 shrink-0 text-nexum-text-muted" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-nexum-text">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-nexum-text-muted">{description}</p>
        )}
      </div>
    </div>
  );
}
