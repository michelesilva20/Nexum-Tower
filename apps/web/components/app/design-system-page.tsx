"use client";

import { PageHeader } from "@/components/layout/page-header";
import {
  NexumBadge,
  NexumButton,
  NexumCard,
  NexumConfirmModal,
  NexumDrawer,
  NexumEmptyState,
  NexumFormField,
  NexumInput,
  NexumMetricCard,
  NexumModal,
  NexumRiskBadge,
  NexumSelect,
  NexumSkeleton,
  NexumStatusBadge,
  NexumTabs,
  NexumToast,
  useNexumToast,
} from "@/components/ui/nexum";
import { Truck } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function DesignSystemPage() {
  const t = useTranslations("admin.designSystem");
  const { toast } = useNexumToast();
  const [tab, setTab] = useState("overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <PageHeader
        breadcrumb={[
          { label: t("breadcrumbRoot"), href: "/app" },
          { label: t("breadcrumbCurrent") },
        ]}
        title={t("title")}
        description={t("description")}
      />

      <NexumTabs
        tabs={[
          { key: "overview", label: t("tabs.overview") },
          { key: "forms", label: t("tabs.forms") },
          { key: "feedback", label: t("tabs.feedback") },
        ]}
        activeKey={tab}
        onChange={setTab}
      />

      {tab === "overview" && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-nexum-text">{t("sections.buttons")}</h2>
            <div className="flex flex-wrap gap-2">
              <NexumButton>{t("samples.primary")}</NexumButton>
              <NexumButton variant="secondary">{t("samples.secondary")}</NexumButton>
              <NexumButton variant="outline">{t("samples.outline")}</NexumButton>
              <NexumButton variant="ghost">{t("samples.ghost")}</NexumButton>
              <NexumButton variant="danger">{t("samples.danger")}</NexumButton>
              <NexumButton loading>{t("samples.loading")}</NexumButton>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-nexum-text">{t("sections.badges")}</h2>
            <div className="flex flex-wrap gap-2">
              <NexumBadge variant="success">Success</NexumBadge>
              <NexumBadge variant="warning">Warning</NexumBadge>
              <NexumBadge variant="risk">Risk</NexumBadge>
              <NexumBadge variant="danger">Danger</NexumBadge>
              <NexumStatusBadge status="IN_TRANSIT" />
              <NexumRiskBadge score={72} />
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <NexumMetricCard label="KPI" value="128" change="+12,5%" changePositive />
            <NexumCard variant="interactive">
              <p className="text-sm font-medium text-nexum-text">{t("samples.interactiveCard")}</p>
            </NexumCard>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-nexum-text">{t("sections.skeleton")}</h2>
            <NexumSkeleton className="h-10 w-full max-w-md" />
          </section>
        </div>
      )}

      {tab === "forms" && (
        <NexumCard className="max-w-md space-y-4">
          <NexumFormField label={t("samples.email")} htmlFor="ds-email" required>
            <NexumInput id="ds-email" placeholder="admin@nexumtower.local" />
          </NexumFormField>
          <NexumFormField label={t("samples.status")} htmlFor="ds-status">
            <NexumSelect id="ds-status">
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label={t("samples.errorField")} error={t("samples.errorMessage")}>
            <NexumInput error />
          </NexumFormField>
        </NexumCard>
      )}

      {tab === "feedback" && (
        <div className="space-y-6">
          <NexumToast type="success" title={t("samples.toastSuccess")} />
          <NexumEmptyState
            icon={Truck}
            title={t("samples.emptyTitle")}
            description={t("samples.emptyDescription")}
            actionLabel={t("samples.emptyAction")}
            onAction={() => undefined}
          />
          <div className="flex flex-wrap gap-2">
            <NexumButton variant="secondary" onClick={() => setModalOpen(true)}>
              {t("samples.openModal")}
            </NexumButton>
            <NexumButton variant="secondary" onClick={() => setConfirmOpen(true)}>
              {t("samples.openConfirm")}
            </NexumButton>
            <NexumButton variant="secondary" onClick={() => setDrawerOpen(true)}>
              {t("samples.openDrawer")}
            </NexumButton>
            <NexumButton
              onClick={() =>
                toast({ type: "success", title: t("samples.toastSuccess") })
              }
            >
              {t("samples.showToast")}
            </NexumButton>
          </div>
        </div>
      )}

      <NexumModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t("samples.modalTitle")}
        description={t("samples.modalDescription")}
        footer={
          <NexumButton variant="secondary" onClick={() => setModalOpen(false)}>
            {t("samples.close")}
          </NexumButton>
        }
      />

      <NexumConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        title={t("samples.confirmTitle")}
        description={t("samples.confirmDescription")}
        confirmLabel={t("samples.confirmAction")}
        cancelLabel={t("samples.close")}
        danger
      />

      <NexumDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t("samples.drawerTitle")}
        description={t("samples.drawerDescription")}
        footer={
          <NexumButton variant="secondary" onClick={() => setDrawerOpen(false)}>
            {t("samples.close")}
          </NexumButton>
        }
      >
        <p className="text-sm text-nexum-text-muted">{t("samples.drawerBody")}</p>
      </NexumDrawer>
    </div>
  );
}
