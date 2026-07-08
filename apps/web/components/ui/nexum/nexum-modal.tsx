"use client";

import { NexumButton } from "@/components/ui/nexum/nexum-button";
import { NexumOverlayPortal, NEXUM_OVERLAY_Z } from "@/components/ui/nexum/nexum-overlay-portal";
import { cn } from "@nexum-tower/ui";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
type NexumModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "confirmation" | "danger" | "form" | "details";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Fechar ao clicar no overlay (padrão: true). */
  closeOnOverlay?: boolean;
};

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
};

export function NexumModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "default",
  size = "md",
  closeOnOverlay = true,
}: NexumModalProps) {
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
        onClick={closeOnOverlay ? onClose : undefined}
        aria-label="Fechar"
        tabIndex={closeOnOverlay ? 0 : -1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nexum-modal-title"
        className={cn(
          "relative flex max-h-[min(90vh,920px)] w-full flex-col overflow-hidden rounded-2xl border border-nexum-border bg-nexum-surface shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeClasses[size],
          variant === "danger" && "border-nexum-danger/30",
        )}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-nexum-border px-5 py-4">
          <div>
            <h2 id="nexum-modal-title" className="text-lg font-semibold text-nexum-text">
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

        {children && (
          <div
            className={cn(
              (variant === "form" || variant === "details") && "min-h-0 flex-1 overflow-y-auto bg-nexum-bg px-5 py-5",
              variant !== "form" && variant !== "details" && "px-5 py-4",
            )}
          >
            {children}
          </div>
        )}

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

export function NexumConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}) {
  return (
    <NexumModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      variant={danger ? "danger" : "confirmation"}
      size="sm"
      footer={
        <>
          <NexumButton variant="ghost" onClick={onClose}>
            {cancelLabel}
          </NexumButton>
          <NexumButton variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </NexumButton>
        </>
      }
    />
  );
}
