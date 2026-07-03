"use client";

import { cn } from "@nexum-tower/ui";

export type NexumTab = {
  key: string;
  label: string;
  disabled?: boolean;
};

type NexumTabsProps = {
  tabs: NexumTab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
};

export function NexumTabs({ tabs, activeKey, onChange, className }: NexumTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl border border-nexum-border/50 bg-nexum-bg-soft/50 p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            onClick={() => onChange(tab.key)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              active
                ? "bg-gradient-to-r from-nexum-primary/15 to-nexum-secondary/10 text-nexum-text shadow-sm ring-1 ring-nexum-primary/20"
                : "text-nexum-text-muted hover:bg-nexum-surface/50 hover:text-nexum-text",
              tab.disabled && "pointer-events-none opacity-50",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
