import { NexumBreadcrumb, type BreadcrumbItem } from "@/components/ui/nexum/nexum-breadcrumb";

export type { BreadcrumbItem };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return <NexumBreadcrumb items={items} />;
}
