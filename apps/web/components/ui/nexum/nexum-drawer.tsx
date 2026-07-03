"use client";

import { cn } from "@nexum-tower/ui";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type NexumDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg";
};

const widthClasses = {
  sm: "max-w-[420px]",
  md: "max-w-[480px]",
  lg: "max-w-[560px]",
};

export function NexumDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
}: NexumDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fechar painel"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          "relative flex h-full w-full flex-col border-l border-nexum-border bg-nexum-bg-soft shadow-2xl",
          "animate-in slide-in-from-right duration-300",
          widthClasses[width],
        )}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-nexum-border px-5 py-4">
          <div>
            <h2 id="drawer-title" className="text-lg font-semibold text-nexum-text">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-nexum-text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-nexum-text-muted hover:bg-nexum-surface"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-nexum-border px-5 py-4">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}
