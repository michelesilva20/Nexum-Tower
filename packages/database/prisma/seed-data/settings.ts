/**
 * Definições de parâmetros da plataforma (SettingDefinition) e feature flags
 * (Feature) — seedadas de forma idempotente. Ver docs/SETTINGS.md e
 * docs/FEATURE-FLAGS.md.
 */

export type SettingValueTypeSeed = "STRING" | "NUMBER" | "BOOLEAN" | "JSON" | "SELECT";

export type SettingDefinitionSeed = {
  key: string;
  module: string;
  label: string;
  description?: string;
  valueType: SettingValueTypeSeed;
  defaultValue: unknown;
  options?: unknown;
  isSensitive?: boolean;
};

export const SETTING_DEFINITIONS: SettingDefinitionSeed[] = [
  // security
  { key: "security.require_mfa", module: "security", label: "Exigir MFA", description: "Exige autenticação multifator no login.", valueType: "BOOLEAN", defaultValue: false, isSensitive: true },
  { key: "security.max_login_attempts", module: "security", label: "Máx. tentativas de login", description: "Tentativas antes do bloqueio temporário.", valueType: "NUMBER", defaultValue: 5, isSensitive: true },
  { key: "security.lockout_minutes", module: "security", label: "Tempo de bloqueio (min)", description: "Duração do bloqueio após exceder tentativas.", valueType: "NUMBER", defaultValue: 15, isSensitive: true },

  // access
  { key: "access.password_min_length", module: "access", label: "Tamanho mínimo de senha", valueType: "NUMBER", defaultValue: 8 },

  // sessions
  { key: "sessions.access_token_minutes", module: "sessions", label: "Expiração do access token (min)", valueType: "NUMBER", defaultValue: 15 },
  { key: "sessions.refresh_token_days", module: "sessions", label: "Expiração do refresh token (dias)", valueType: "NUMBER", defaultValue: 7 },

  // users
  { key: "users.invitation_expiration_hours", module: "users", label: "Expiração do convite (horas)", valueType: "NUMBER", defaultValue: 48 },

  // audit
  { key: "audit.retention_days", module: "audit", label: "Retenção de auditoria (dias)", valueType: "NUMBER", defaultValue: 90 },

  // operational
  { key: "operational.default_timezone", module: "operational", label: "Fuso horário padrão", valueType: "STRING", defaultValue: "America/Sao_Paulo" },
  { key: "operational.default_locale", module: "operational", label: "Idioma padrão", valueType: "SELECT", defaultValue: "pt", options: ["pt", "en", "es"] },

  // sla
  { key: "sla.default_tolerance_minutes", module: "sla", label: "Tolerância de SLA padrão (min)", valueType: "NUMBER", defaultValue: 30 },

  // incidents
  { key: "incidents.require_comment_on_resolve", module: "incidents", label: "Comentário obrigatório ao resolver", valueType: "BOOLEAN", defaultValue: true },

  // costs
  { key: "costs.require_approval_above_amount", module: "costs", label: "Aprovação acima de (valor)", valueType: "NUMBER", defaultValue: 1000 },

  // documents
  { key: "documents.max_upload_size_mb", module: "documents", label: "Tamanho máx. de upload (MB)", valueType: "NUMBER", defaultValue: 25 },

  // notifications
  { key: "notifications.email_enabled", module: "notifications", label: "Notificações por e-mail", valueType: "BOOLEAN", defaultValue: true },
];

export type FeatureDefinitionSeed = {
  key: string;
  name: string;
  module: string;
  description?: string;
  defaultEnabled?: boolean;
};

export const FEATURE_DEFINITIONS: FeatureDefinitionSeed[] = [
  { key: "nexum_ai.enabled", name: "Nexum AI", module: "intelligence", description: "Recursos de IA operacional.", defaultEnabled: false },
  { key: "customer_portal.enabled", name: "Portal do Cliente", module: "portals", description: "Acesso ao portal do cliente.", defaultEnabled: false },
  { key: "driver_portal.enabled", name: "Portal do Motorista", module: "portals", description: "Acesso ao app do motorista.", defaultEnabled: false },
  { key: "advanced_rbac.enabled", name: "RBAC Avançado", module: "platform", description: "Overrides e regras contextuais avançadas.", defaultEnabled: true },
  { key: "audit_export.enabled", name: "Exportação de Auditoria", module: "platform", description: "Exportar trilha de auditoria.", defaultEnabled: false },
  { key: "map_tracking.enabled", name: "Rastreamento em Mapa", module: "operational", description: "Rastreamento em tempo real no mapa.", defaultEnabled: false },
  { key: "operational_dashboard.enabled", name: "Dashboard Operacional", module: "operational", description: "Painel operacional em tempo real.", defaultEnabled: false },
];
