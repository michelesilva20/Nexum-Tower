"use client";

import { NexumButton } from "@/components/ui/nexum/nexum-button";
import { cn } from "@nexum-tower/ui";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

type NexumModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "confirmation" | "danger" | "form" | "details";
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
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
}: NexumModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] rounded-2xl border border-nexum-border bg-nexum-bg-soft p-0 text-nexum-text shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        "open:animate-in open:fade-in open:zoom-in-95",
        sizeClasses[size],
        variant === "danger" && "border-nexum-danger/30",
      )}
    >
      <div className="flex items-start justify-between border-b border-nexum-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-nexum-text">{title}</h2>
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

      {children && <div className="px-5 py-4">{children}</div>}

      {footer && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-nexum-border px-5 py-4">
          {footer}
        </div>
      )}
    </dialog>
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
