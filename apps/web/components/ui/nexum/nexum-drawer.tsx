"use client";

import { NexumOverlayPortal, NEXUM_OVERLAY_Z } from "@/components/ui/nexum/nexum-overlay-portal";
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
  /** Largura do modal centralizado (legado: prop `width` mantida por compatibilidade). */
  width?: "sm" | "md" | "lg";
};

const widthClasses = {
  sm: "max-w-lg",
  md: "max-w-3xl",
  lg: "max-w-5xl",
};

/**
 * Painel de formulário/detalhe em modal centralizado.
 * Mantém o nome NexumDrawer por compatibilidade com telas existentes.
 */
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
    <NexumOverlayPortal open={open}>
      <div className={cn("fixed inset-0 flex items-center justify-center p-4 sm:p-6", NEXUM_OVERLAY_Z)}>
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nexum-panel-title"
        className={cn(
          "relative flex max-h-[min(90vh,920px)] w-full flex-col overflow-hidden rounded-2xl border border-nexum-border bg-nexum-surface shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
          widthClasses[width],
        )}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-nexum-border px-5 py-4">
          <div>
            <h2 id="nexum-panel-title" className="text-lg font-semibold text-nexum-text">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-nexum-text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-nexum-text-muted hover:bg-nexum-surface hover:text-nexum-text"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-nexum-bg px-5 py-5">{children}</div>

        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-nexum-border px-5 py-4">
            {footer}
          </div>
        )}
      </div>
      </div>
    </NexumOverlayPortal>
  );
}