"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/app/permission-gate";
import {
  NexumBadge,
  NexumCard,
  NexumMetricCard,
} from "@/components/ui/nexum";
import { Link } from "@/i18n/navigation";
import { fetchAuditLogs, fetchSessions } from "@/lib/admin-api";
import {
  Activity,
  CheckCircle2,
  Clock,
  Lock,
  Monitor,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

type SecurityStats = {
  activeSessions: number;
  loginFailures: number;
  accessDenied: number;
  rlsConfigured: boolean;
  rateLimitActive: boolean;
  httpsCookies: boolean;
};

function SecurityItem({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-nexum-success" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0 text-nexum-danger" />
        )}
        <span className="text-sm text-nexum-text">{label}</span>
      </div>
      {detail && (
        <span className="text-xs text-nexum-text-muted">{detail}</span>
      )}
    </div>
  );
}

export function SecurityConsolePage() {
  const [stats, setStats] = useState<SecurityStats>({
    activeSessions: 0,
    loginFailures: 0,
    accessDenied: 0,
    rlsConfigured: true,
    rateLimitActive: true,
    httpsCookies: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [sessions, auditLogs] = await Promise.all([
          fetchSessions(),
          fetchAuditLogs({ limit: 200 }),
        ]);

        const activeSessions = sessions.filter((s) => !s.revokedAt).length;
        const loginFailures = auditLogs.filter((l) => l.action === "LOGIN_FAILED").length;
        const accessDenied = auditLogs.filter((l) => l.action === "ACCESS_DENIED").length;

        setStats((prev) => ({
          ...prev,
          activeSessions,
          loginFailures,
          accessDenied,
        }));
      } catch {
        // silently fail — show static info
      } finally {
        setLoading(false);
      }
    }
    void loadStats();
  }, []);

  const rlsEnabled = process.env.NODE_ENV !== "production"
    ? false
    : stats.rlsConfigured;

  return (
    <PermissionGate permission="security.read">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          breadcrumb={[
            { label: "Configurações", href: "/app/settings" },
            { label: "Console de Segurança" },
          ]}
          title="Console de Segurança"
          description="Visão centralizada das proteções ativas e do status de segurança do tenant."
        />

        {/* Cards de métricas */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NexumMetricCard
            label="Sessões ativas"
            value={loading ? "..." : stats.activeSessions}
            icon={<Monitor className="h-5 w-5" />}
          />
          <NexumMetricCard
            label="Logins falhos (recentes)"
            value={loading ? "..." : stats.loginFailures}
            icon={<ShieldAlert className="h-5 w-5" />}
          />
          <NexumMetricCard
            label="Acessos negados"
            value={loading ? "..." : stats.accessDenied}
            icon={<Activity className="h-5 w-5" />}
          />
          <NexumMetricCard
            label="Proteções ativas"
            value={5}
            icon={<Shield className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Checklist de segurança */}
          <NexumCard padding="md">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-nexum-primary" />
              <h3 className="font-semibold text-nexum-text">Checklist de Segurança</h3>
            </div>
            <div className="divide-y divide-nexum-border">
              <SecurityItem label="JWT + Refresh Token" ok detail="Rotação automática" />
              <SecurityItem label="Cookies httpOnly" ok detail="SameSite=Lax" />
              <SecurityItem label="RBAC + ABAC ativos" ok />
              <SecurityItem label="Rate Limiting (Throttle)" ok detail="60 req/min" />
              <SecurityItem label="Helmet (headers de segurança)" ok />
              <SecurityItem label="ValidationPipe (whitelist)" ok />
              <SecurityItem label="CORS configurado" ok />
              <SecurityItem label="Auditoria de ações sensíveis" ok />
              <SecurityItem
                label="RLS no banco de dados"
                ok={stats.rlsConfigured}
                detail={
                  process.env.NODE_ENV !== "production"
                    ? "FORCE RLS desativado em dev"
                    : undefined
                }
              />
              <SecurityItem label="MFA" ok={false} detail="Planejado" />
              <SecurityItem label="SSO / SAML" ok={false} detail="Planejado" />
            </div>
          </NexumCard>

          {/* Política de sessão */}
          <NexumCard padding="md">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-nexum-primary" />
              <h3 className="font-semibold text-nexum-text">Política de Sessão</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-nexum-text-muted">Expiração do Access Token</span>
                <code className="text-xs text-nexum-text">15 minutos</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-nexum-text-muted">Expiração do Refresh Token</span>
                <code className="text-xs text-nexum-text">7 dias</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-nexum-text-muted">Rotação de Refresh</span>
                <NexumBadge variant="success">Ativo</NexumBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-nexum-text-muted">Logout em todos dispositivos</span>
                <NexumBadge variant="success">Disponível</NexumBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-nexum-text-muted">Sessões simultâneas</span>
                <code className="text-xs text-nexum-text">Ilimitadas</code>
              </div>
            </div>
            <div className="mt-4 border-t border-nexum-border pt-3">
              <Link href="/app/security/sessions">
                <span className="text-sm text-nexum-primary hover:underline">
                  Ver sessões ativas →
                </span>
              </Link>
            </div>
          </NexumCard>

          {/* Proteções ativas */}
          <NexumCard padding="md">
            <div className="mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-nexum-primary" />
              <h3 className="font-semibold text-nexum-text">Proteções Ativas</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: "bcrypt (custo 12)", desc: "Hashing de senhas" },
                { label: "GlobalExceptionFilter", desc: "Erros padronizados sem leakage" },
                { label: "GlobalResponseInterceptor", desc: "Envelope de resposta padrão" },
                { label: "RequestId Middleware", desc: "Rastreabilidade de requisições" },
                { label: "AuditService", desc: "Log de ações sensíveis" },
                { label: "AuthorizationService (ABAC)", desc: "Isolamento multi-tenant" },
              ].map((p) => (
                <div
                  key={p.label}
                  className="flex items-start gap-2 rounded-xl bg-nexum-surface px-3 py-2"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-nexum-success" />
                  <div>
                    <p className="text-sm font-medium text-nexum-text">{p.label}</p>
                    <p className="text-xs text-nexum-text-muted">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </NexumCard>

          {/* RLS Status */}
          <NexumCard padding="md">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-nexum-primary" />
              <h3 className="font-semibold text-nexum-text">RLS — Row Level Security</h3>
            </div>
            <div className="space-y-2">
              {[
                "User",
                "Group",
                "GroupMember",
                "UserRole",
                "GroupRole",
                "UserPermissionOverride",
                "AuthSession",
                "AuditLog",
                "TenantSetting",
                "TenantFeature",
              ].map((table) => (
                <div key={table} className="flex items-center justify-between py-0.5">
                  <code className="text-xs text-nexum-text">{table}</code>
                  <NexumBadge variant="success">ENABLE RLS + POLICY</NexumBadge>
                </div>
              ))}
              <div className="mt-3 rounded-xl border border-nexum-warning/30 bg-nexum-warning/5 px-3 py-2">
                <p className="text-xs text-nexum-warning">
                  FORCE ROW LEVEL SECURITY não está ativo em desenvolvimento. Ver{" "}
                  <code>docs/RLS-HARDENING.md</code> para ativação em produção.
                </p>
              </div>
            </div>
          </NexumCard>
        </div>

        {/* Links rápidos */}
        <NexumCard padding="md">
          <h3 className="mb-3 font-semibold text-nexum-text">Acesso rápido</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/admin/audit">
              <NexumBadge variant="info" className="cursor-pointer hover:opacity-80">
                <Activity className="mr-1 h-3 w-3" />
                Ver Auditoria
              </NexumBadge>
            </Link>
            <Link href="/app/security/sessions">
              <NexumBadge variant="info" className="cursor-pointer hover:opacity-80">
                <Monitor className="mr-1 h-3 w-3" />
                Sessões Ativas
              </NexumBadge>
            </Link>
            <Link href="/app/settings/parameters">
              <NexumBadge variant="info" className="cursor-pointer hover:opacity-80">
                <Settings className="mr-1 h-3 w-3" />
                Parâmetros
              </NexumBadge>
            </Link>
            <Link href="/app/admin/users">
              <NexumBadge variant="info" className="cursor-pointer hover:opacity-80">
                <Users className="mr-1 h-3 w-3" />
                Usuários
              </NexumBadge>
            </Link>
          </div>
        </NexumCard>
      </div>
    </PermissionGate>
  );
}
