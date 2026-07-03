"use client";

import { cn } from "@nexum-tower/ui";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type NexumDropdownItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  separator?: boolean;
  onSelect?: () => void;
};

type NexumDropdownProps = {
  trigger: ReactNode;
  items: NexumDropdownItem[];
  align?: "start" | "end";
  className?: string;
};

export function NexumDropdown({
  trigger,
  items,
  align = "end",
  className,
}: NexumDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-nexum-border bg-nexum-surface py-1 shadow-xl",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) =>
            item.separator ? (
              <div key={item.key} className="my-1 border-t border-nexum-border/60" />
            ) : (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  item.onSelect?.();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  item.danger
                    ? "text-nexum-danger hover:bg-nexum-danger-bg"
                    : "text-nexum-text-muted hover:bg-nexum-surface-hover hover:text-nexum-text",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
