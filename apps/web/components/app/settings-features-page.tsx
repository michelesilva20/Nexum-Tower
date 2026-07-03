"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate, usePermission } from "@/components/app/permission-gate";
import {
  NexumBadge,
  NexumButton,
  NexumCard,
  NexumSelect,
  NexumSwitch,
  NexumToastProvider,
  useNexumToast,
} from "@/components/ui/nexum";
import { fetchFeatures, updateFeature, type FeatureRow } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";

const MODULE_LABELS: Record<string, string> = {
  ai: "Nexum AI",
  customer: "Portal do Cliente",
  driver: "Portal do Motorista",
  access: "Controle de Acesso",
  audit: "Auditoria",
  map: "Mapa",
  operational: "Operacional",
};

function SettingsFeaturesPageInner() {
  const { toast } = useNexumToast();
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState("");

  const canManage = usePermission("features.manage");

  const load = useCallback(() => {
    setLoading(true);
    void fetchFeatures()
      .then(setFeatures)
      .catch(() => toast({ type: "error", title: "Erro ao carregar feature flags." }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const modules = useMemo(
    () => Array.from(new Set(features.map((f) => f.module))).sort(),
    [features],
  );

  const filtered = useMemo(
    () => (!moduleFilter ? features : features.filter((f) => f.module === moduleFilter)),
    [features, moduleFilter],
  );

  async function handleToggle(feature: FeatureRow) {
    const isEnabled = feature.tenantFeature?.enabled ?? feature.defaultEnabled;
    setToggling(feature.key);
    try {
      await updateFeature(feature.key, { enabled: !isEnabled });
      toast({
        type: "success",
        title: `${feature.label} ${!isEnabled ? "ativada" : "desativada"}.`,
      });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    } finally {
      setToggling(null);
    }
  }

  return (
    <PermissionGate permission="features.read">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          breadcrumb={[
            { label: "Configurações", href: "/app/settings" },
            { label: "Feature Flags" },
          ]}
          title="Feature Flags"
          description="Ative ou desative funcionalidades específicas para este tenant."
          actions={
            <NexumSelect
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-44"
            >
              <option value="">Todos os módulos</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {MODULE_LABELS[m] ?? m}
                </option>
              ))}
            </NexumSelect>
          }
        />

        {loading ? (
          <NexumCard padding="md">
            <p className="text-sm text-nexum-text-muted">Carregando feature flags...</p>
          </NexumCard>
        ) : filtered.length === 0 ? (
          <NexumCard padding="lg" className="text-center">
            <p className="text-sm text-nexum-text-muted">Nenhuma feature flag encontrada.</p>
          </NexumCard>
        ) : (
          <NexumCard padding="md">
            <div className="divide-y divide-nexum-border">
              {filtered.map((feature) => {
                const isEnabled = feature.tenantFeature?.enabled ?? feature.defaultEnabled;
                const isOverridden = feature.tenantFeature != null;
                return (
                  <div key={feature.key} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-nexum-text">{feature.label}</p>
                        <NexumBadge variant="neutral">{feature.module}</NexumBadge>
                        {isOverridden && (
                          <NexumBadge variant="info">Configurada</NexumBadge>
                        )}
                        {feature.defaultEnabled !== isEnabled && (
                          <NexumBadge variant="warning">Valor padrão alterado</NexumBadge>
                        )}
                      </div>
                      {feature.description && (
                        <p className="mt-0.5 text-xs text-nexum-text-muted">
                          {feature.description}
                        </p>
                      )}
                      <code className="text-xs text-nexum-text-soft">{feature.key}</code>
                      {feature.tenantFeature?.updatedAt && (
                        <p className="text-xs text-nexum-text-soft">
                          Última alteração:{" "}
                          {new Date(feature.tenantFeature.updatedAt).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`text-xs font-medium ${isEnabled ? "text-nexum-success" : "text-nexum-text-muted"}`}
                      >
                        {isEnabled ? "Ativo" : "Inativo"}
                      </span>
                      {canManage ? (
                        <NexumSwitch
                          label=""
                          checked={isEnabled}
                          onChange={() => void handleToggle(feature)}
                          id={`feat-${feature.key}`}
                        />
                      ) : (
                        <NexumBadge variant={isEnabled ? "success" : "neutral"} dot>
                          {isEnabled ? "Ativo" : "Inativo"}
                        </NexumBadge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </NexumCard>
        )}
      </div>
    </PermissionGate>
  );
}

export function SettingsFeaturesPage() {
  return (
    <NexumToastProvider>
      <SettingsFeaturesPageInner />
    </NexumToastProvider>
  );
}
