"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/app/permission-gate";
import {
  NexumBadge,
  NexumButton,
  NexumCard,
  NexumDataTable,
  NexumMetricCard,
  NexumRiskBadge,
  NexumStatusBadge,
} from "@/components/ui/nexum";
import { useAuth } from "@/providers/auth-provider";
import { useTablePagination } from "@/hooks/use-table-pagination";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Package,
  TrendingUp,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { fadeIn, motionTransition, staggerContainer } from "@/components/ui/nexum/motion";

const demoTrips = [
  {
    id: "1",
    code: "NX-2048",
    client: "Demo Logistics",
    route: "SP → RJ",
    status: "IN_TRANSIT" as const,
    risk: 42,
    eta: "14:30",
  },
  {
    id: "2",
    code: "NX-2049",
    client: "Transmaion",
    route: "Curitiba → POA",
    status: "WAITING_UNLOAD" as const,
    risk: 68,
    eta: "16:15",
  },
  {
    id: "3",
    code: "NX-2050",
    client: "Cliente Beta",
    route: "BH → Brasília",
    status: "WITH_INCIDENT" as const,
    risk: 86,
    eta: "18:00",
  },
  {
    id: "4",
    code: "NX-2051",
    client: "Nexum Demo",
    route: "Recife → Salvador",
    status: "DELIVERED" as const,
    risk: 12,
    eta: "—",
  },
  {
    id: "5",
    code: "NX-2052",
    client: "Logística Norte",
    route: "Manaus → Belém",
    status: "PLANNED" as const,
    risk: 24,
    eta: "09:00",
  },
  {
    id: "6",
    code: "NX-2053",
    client: "Demo Logistics",
    route: "Campinas → Santos",
    status: "LOADING" as const,
    risk: 35,
    eta: "11:45",
  },
  {
    id: "7",
    code: "NX-2054",
    client: "Transmaion",
    route: "Goiânia → Cuiabá",
    status: "STOPPED" as const,
    risk: 58,
    eta: "15:20",
  },
  {
    id: "8",
    code: "NX-2055",
    client: "Cliente Beta",
    route: "Fortaleza → Natal",
    status: "FINISHED" as const,
    risk: 8,
    eta: "—",
  },
];

export function AppOverviewPage() {
  const t = useTranslations("admin.commandCenter");
  const { user } = useAuth();
  const { paginatedItems, pagination } = useTablePagination(demoTrips, { initialPageSize: 5 });

  if (!user) return null;

  return (
    <PermissionGate permission="dashboard.read">
    <motion.div
      className="mx-auto max-w-7xl space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={fadeIn} transition={motionTransition}>
        <PageHeader
          breadcrumb={[
            { label: t("breadcrumbRoot"), href: "/app" },
            { label: t("breadcrumbCurrent") },
          ]}
          title={t("title")}
          description={t("description")}
          badge={{ label: t("liveBadge"), variant: "success" }}
          actions={
            <>
              <NexumButton variant="secondary">{t("actions.filters")}</NexumButton>
              <NexumButton variant="secondary">{t("actions.export")}</NexumButton>
              <NexumButton iconLeft={<Truck className="h-4 w-4" />}>{t("actions.newTrip")}</NexumButton>
            </>
          }
        />
      </motion.div>

      <motion.div
        variants={fadeIn}
        transition={motionTransition}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <NexumMetricCard
          label={t("kpis.tripsInProgress.label")}
          value="128"
          change={t("kpis.tripsInProgress.change")}
          changePositive
          icon={<Truck className="h-5 w-5" />}
        />
        <NexumMetricCard
          label={t("kpis.onTime.label")}
          value="94,8%"
          change={t("kpis.onTime.change")}
          changePositive
          icon={<Clock className="h-5 w-5" />}
        />
        <NexumMetricCard
          label={t("kpis.incidents.label")}
          value="17"
          change={t("kpis.incidents.change")}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <NexumMetricCard
          label={t("kpis.margin.label")}
          value="18,4%"
          change={t("kpis.margin.change")}
          changePositive
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.div variants={fadeIn} transition={motionTransition} className="xl:col-span-2">
          <NexumDataTable
            title={t("recentTrips.title")}
            description={t("recentTrips.description")}
            rows={paginatedItems}
            pagination={pagination}
            toolbar={
              <NexumButton variant="ghost" className="h-9 text-xs">
                {t("recentTrips.viewAll")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </NexumButton>
            }
            columns={[
              {
                key: "code",
                header: t("recentTrips.columns.trip"),
                render: (r) => (
                  <span className="font-mono text-xs font-semibold text-nexum-primary">{r.code}</span>
                ),
              },
              { key: "client", header: t("recentTrips.columns.client"), render: (r) => r.client },
              { key: "route", header: t("recentTrips.columns.route"), render: (r) => r.route },
              {
                key: "status",
                header: t("recentTrips.columns.status"),
                render: (r) => <NexumStatusBadge status={r.status} />,
              },
              {
                key: "risk",
                header: t("recentTrips.columns.risk"),
                render: (r) => <NexumRiskBadge score={r.risk} />,
              },
              { key: "eta", header: t("recentTrips.columns.eta"), render: (r) => r.eta },
            ]}
          />
        </motion.div>

        <motion.div variants={fadeIn} transition={motionTransition} className="space-y-4">
          <NexumCard variant="glass">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-nexum-text">{t("riskCard.title")}</h3>
              <NexumBadge variant="risk">{t("riskCard.badge")}</NexumBadge>
            </div>
            <p className="mt-3 text-3xl font-bold text-nexum-risk">72</p>
            <p className="mt-1 text-xs text-nexum-text-muted">{t("riskCard.description")}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-nexum-bg-soft">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-nexum-warning to-nexum-risk" />
            </div>
          </NexumCard>

          <NexumCard variant="danger">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-nexum-danger" />
              <div>
                <h3 className="text-sm font-semibold text-nexum-text">{t("criticalCard.title")}</h3>
                <p className="mt-1 text-xs text-nexum-text-muted">{t("criticalCard.description")}</p>
                <ul className="mt-3 space-y-2 text-xs text-nexum-text-muted">
                  <li>NX-2050 · {t("criticalCard.item1")}</li>
                  <li>NX-2031 · {t("criticalCard.item2")}</li>
                </ul>
              </div>
            </div>
          </NexumCard>

          <NexumCard>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-nexum-primary" />
              <h3 className="text-sm font-semibold text-nexum-text">{t("activityCard.title")}</h3>
            </div>
            <ul className="mt-4 space-y-3 text-xs text-nexum-text-muted">
              <li className="flex gap-2">
                <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nexum-secondary" />
                {t("activityCard.item1")}
              </li>
              <li className="flex gap-2">
                <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nexum-primary" />
                {t("activityCard.item2")}
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nexum-warning" />
                {t("activityCard.item3")}
              </li>
            </ul>
          </NexumCard>
        </motion.div>
      </div>
    </motion.div>
    </PermissionGate>
  );
}
