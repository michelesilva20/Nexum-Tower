"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate, usePermission } from "@/components/app/permission-gate";
import {
  NexumBadge,
  NexumButton,
  NexumCard,
  NexumFormField,
  NexumInput,
  NexumSelect,
  NexumSwitch,
  NexumTextarea,
  NexumToastProvider,
  useNexumToast,
} from "@/components/ui/nexum";
import { fetchSettings, updateSetting, type SettingRow } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  security: "Segurança",
  sessions: "Sessões",
  access: "Acesso",
  audit: "Auditoria",
  operational: "Operacional",
  sla: "SLA",
  incidents: "Ocorrências",
  costs: "Custos",
  documents: "Documentos",
  notifications: "Notificações",
  features: "Features",
};

function SettingControl({
  setting,
  disabled,
  onChange,
}: {
  setting: SettingRow;
  disabled: boolean;
  onChange: (val: unknown) => void;
}) {
  const currentVal = setting.tenantValue?.value ?? setting.defaultValue;

  if (setting.valueType === "BOOLEAN") {
    return (
      <NexumSwitch
        label=""
        checked={Boolean(currentVal)}
        onChange={(v) => onChange(v)}
        id={setting.key}
      />
    );
  }

  if (setting.valueType === "NUMBER") {
    return (
      <NexumInput
        type="number"
        defaultValue={String(currentVal ?? "")}
        onBlur={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    );
  }

  if (setting.valueType === "SELECT") {
    const opts = (setting.options as string[]) ?? [];
    return (
      <NexumSelect
        value={String(currentVal ?? "")}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {opts.map((o: string) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </NexumSelect>
    );
  }

  if (setting.valueType === "JSON") {
    return (
      <NexumTextarea
        defaultValue={JSON.stringify(currentVal, null, 2)}
        onBlur={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            // invalid JSON — ignore
          }
        }}
        disabled={disabled}
        rows={4}
        className="font-mono text-xs"
      />
    );
  }

  return (
    <NexumInput
      defaultValue={String(currentVal ?? "")}
      onBlur={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}

function SettingsParametersPageInner() {
  const { toast } = useNexumToast();
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({});
  const [categoryFilter, setCategoryFilter] = useState("");

  const canUpdate = usePermission("settings.update");

  const load = useCallback(() => {
    setLoading(true);
    void fetchSettings()
      .then(setSettings)
      .catch(() => toast({ type: "error", title: "Erro ao carregar configurações." }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(
    () => Array.from(new Set(settings.map((s) => s.category))).sort(),
    [settings],
  );

  const filtered = useMemo(
    () => (!categoryFilter ? settings : settings.filter((s) => s.category === categoryFilter)),
    [settings, categoryFilter],
  );

  const grouped = useMemo(() => {
    const map: Record<string, SettingRow[]> = {};
    for (const s of filtered) {
      map[s.category] = map[s.category] ?? [];
      map[s.category].push(s);
    }
    return map;
  }, [filtered]);

  function handleChange(key: string, value: unknown) {
    setPendingChanges((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(key: string) {
    if (!(key in pendingChanges)) return;
    setSaving(key);
    try {
      await updateSetting(key, pendingChanges[key]);
      toast({ type: "success", title: "Parâmetro salvo.", description: key });
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao salvar." });
    } finally {
      setSaving(null);
    }
  }

  return (
    <PermissionGate permission="settings.read">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          breadcrumb={[
            { label: "Configurações", href: "/app/settings" },
            { label: "Parâmetros" },
          ]}
          title="Parâmetros da Plataforma"
          description="Configure os parâmetros operacionais e de segurança do tenant."
          actions={
            <NexumSelect
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-48"
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </option>
              ))}
            </NexumSelect>
          }
        />

        {loading ? (
          <NexumCard padding="md">
            <p className="text-sm text-nexum-text-muted">Carregando parâmetros...</p>
          </NexumCard>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <NexumCard key={category} padding="md" className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-nexum-text-muted">
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <div className="divide-y divide-nexum-border">
                {items.map((setting) => (
                  <div key={setting.key} className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-nexum-text">{setting.label}</p>
                        {setting.isSensitive && (
                          <NexumBadge variant="danger">Sensível</NexumBadge>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-xs text-nexum-text-muted">{setting.description}</p>
                      )}
                      <code className="text-xs text-nexum-text-soft">{setting.key}</code>
                    </div>
                    <div className="w-52 shrink-0">
                      <SettingControl
                        setting={setting}
                        disabled={!canUpdate || saving === setting.key}
                        onChange={(v) => handleChange(setting.key, v)}
                      />
                    </div>
                    {canUpdate && setting.key in pendingChanges && (
                      <NexumButton
                        size="sm"
                        onClick={() => void handleSave(setting.key)}
                        disabled={saving === setting.key}
                      >
                        <Save className="mr-1 h-3.5 w-3.5" />
                        {saving === setting.key ? "Salvando..." : "Salvar"}
                      </NexumButton>
                    )}
                  </div>
                ))}
              </div>
            </NexumCard>
          ))
        )}
      </div>
    </PermissionGate>
  );
}

export function SettingsParametersPage() {
  return (
    <NexumToastProvider>
      <SettingsParametersPageInner />
    </NexumToastProvider>
  );
}
