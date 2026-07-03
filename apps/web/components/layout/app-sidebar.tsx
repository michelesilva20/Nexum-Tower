"use client";

import { usePermission } from "@/components/app/permission-gate";
import { NexumLogo } from "@/components/landing/ui/nexum-logo";
import { useAuth } from "@/providers/auth-provider";
import { Link, usePathname } from "@/i18n/navigation";
import { getVisibleNavigation, type AppNavItem } from "@/lib/navigation";
import { cn } from "@nexum-tower/ui";
import { LogOut } from "lucide-react";
import { useLinkStatus } from "next/link";
import { useTranslations } from "next-intl";
import { useState, type ComponentType } from "react";

type AppSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const t = useTranslations("admin.sidebar");
  const tApp = useTranslations("app");
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleNavigation = getVisibleNavigation();

  const content = (
    <>
      <div className="shrink-0 border-b border-nexum-border/50 px-4 py-3.5">
        <NexumLogo />
      </div>

      <nav
        className="app-sidebar-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-2.5"
        aria-label="Main"
      >
        {visibleNavigation.map((group) => (
          <div key={group.key}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-nexum-text-soft">
              {t(`groups.${group.key}`)}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.key}
                  item={item}
                  label={t(`items.${item.key}`)}
                  pathname={pathname}
                  onNavigate={onMobileClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {user && (
        <div className="shrink-0 border-t border-nexum-border/50 p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-nexum-primary/30 bg-nexum-primary/10 text-xs font-semibold text-nexum-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-nexum-text">{user.name}</p>
              <p className="truncate text-[11px] text-nexum-text-soft">{user.tenant.name}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="shrink-0 rounded-lg p-2 text-nexum-text-muted transition-colors hover:bg-nexum-surface/50 hover:text-nexum-text"
              aria-label={tApp("logout")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar — fixa na viewport, scroll só no menu */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden h-svh w-[240px] flex-col border-r border-nexum-border/50 glass-strong lg:flex">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onMobileClose}
            aria-label="Fechar menu"
          />
          <aside className="relative flex h-svh w-[240px] max-w-[85vw] flex-col border-r border-nexum-border bg-nexum-bg-soft shadow-2xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarNavItem({
  item,
  label,
  pathname,
  onNavigate,
}: {
  item: AppNavItem;
  label: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  // suporta tanto `requiredPermission` (novo) quanto `permission` (legado)
  const required = item.requiredPermission ?? (item as AppNavItem & { permission?: string }).permission;
  if (required) {
    return (
      <SidebarNavItemWithPermission
        item={item}
        requiredPermission={required}
        label={label}
        pathname={pathname}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <SidebarNavItemInner
      item={item}
      label={label}
      pathname={pathname}
      onNavigate={onNavigate}
    />
  );
}

function SidebarNavItemWithPermission({
  item,
  requiredPermission,
  label,
  pathname,
  onNavigate,
}: {
  item: AppNavItem;
  requiredPermission: string;
  label: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const allowed = usePermission(requiredPermission);
  if (!allowed) return null;

  return (
    <SidebarNavItemInner
      item={item}
      label={label}
      pathname={pathname}
      onNavigate={onNavigate}
    />
  );
}

function SidebarNavItemInner({
  item,
  label,
  pathname,
  onNavigate,
}: {
  item: AppNavItem;
  label: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon as ComponentType<{ className?: string; strokeWidth?: number }>;
  const active =
    item.href &&
    (pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href)));

  const baseClass = cn(
    "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200",
    active
      ? "nexum-sidebar-active text-nexum-text"
      : "text-nexum-text-muted hover:translate-x-px hover:bg-nexum-surface hover:text-nexum-text",
  );

  const inner = (
    <>
      <Icon
        className={cn("h-4 w-4 shrink-0", active ? "text-nexum-primary" : "text-nexum-text-soft")}
        strokeWidth={1.75}
      />
      <SidebarNavLabel label={label} />
    </>
  );

  if (!item.href) {
    return null;
  }

  return (
    <Link href={item.href} prefetch onClick={onNavigate} className={baseClass}>
      {inner}
    </Link>
  );
}

function SidebarNavLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return <span className={cn("truncate", pending && "opacity-70")}>{label}</span>;
}

export function useSidebarMobile() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return {
    mobileOpen,
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
  };
}
