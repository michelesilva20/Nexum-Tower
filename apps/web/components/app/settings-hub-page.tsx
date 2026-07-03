"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/app/permission-gate";
import { NexumCard } from "@/components/ui/nexum";
import { Link } from "@/i18n/navigation";
import { ClipboardList, Flag, Monitor, ShieldCheck, Sliders } from "lucide-react";

const settingsCards = [
  {
    icon: ShieldCheck,
    title: "Console de Segurança",
    description: "Sessões ativas, política de login, RLS, checklist de segurança.",
    href: "/app/settings/security",
    permission: "security.read",
  },
  {
    icon: Sliders,
    title: "Parâmetros da Plataforma",
    description: "Configure timeouts, limites e parâmetros operacionais do tenant.",
    href: "/app/settings/parameters",
    permission: "settings.read",
  },
  {
    icon: Flag,
    title: "Feature Flags",
    description: "Ative ou desative funcionalidades específicas para este tenant.",
    href: "/app/settings/features",
    permission: "features.read",
  },
  {
    icon: ClipboardList,
    title: "Auditoria",
    description: "Consulte o log de eventos de segurança e acesso.",
    href: "/app/admin/audit",
    permission: "audit.read",
  },
  {
    icon: Monitor,
    title: "Sessões Ativas",
    description: "Visualize e revogue sessões ativas de usuários.",
    href: "/app/security/sessions",
    permission: "sessions.read",
  },
] as const;

export function SettingsHubPage() {
  return (
    <PermissionGate permission="settings.read">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Início", href: "/app" }, { label: "Configurações" }]}
          title="Configurações"
          description="Gerencie os parâmetros, segurança e funcionalidades do tenant."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <NexumCard
                  variant="glass"
                  padding="md"
                  className="group h-full cursor-pointer transition-all duration-200 hover:border-nexum-primary/40 hover:shadow-nexum-primary/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nexum-primary/10 transition-colors group-hover:bg-nexum-primary/20">
                      <Icon className="h-5 w-5 text-nexum-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-nexum-text group-hover:text-nexum-primary">
                        {card.title}
                      </p>
                      <p className="mt-1 text-sm text-nexum-text-muted">{card.description}</p>
                    </div>
                  </div>
                </NexumCard>
              </Link>
            );
          })}
        </div>
      </div>
    </PermissionGate>
  );
}
