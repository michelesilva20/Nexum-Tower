import { cn } from "@nexum-tower/ui";

type NexumSkeletonProps = {
  className?: string;
};

export function NexumSkeleton({ className }: NexumSkeletonProps) {
  return <div className={cn("nexum-skeleton rounded-lg", className)} aria-hidden="true" />;
}

export function NexumCardSkeleton() {
  return (
    <div className="nexum-card space-y-3 p-5">
      <NexumSkeleton className="h-3 w-24" />
      <NexumSkeleton className="h-8 w-32" />
      <NexumSkeleton className="h-3 w-20" />
    </div>
  );
}

export function NexumTableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="nexum-table overflow-hidden rounded-[20px] border border-nexum-border/70 bg-nexum-surface/30">
      <div className="border-b border-nexum-border/60 bg-nexum-bg-soft/40 px-5 py-4">
        <div className="nexum-skeleton h-5 w-40 rounded-lg" />
        <div className="nexum-skeleton mt-2 h-3 w-64 max-w-full rounded-lg" />
      </div>
      <div className="border-b border-nexum-border/60 bg-nexum-bg-soft/90 px-5 py-3.5">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="nexum-skeleton h-3 flex-1 rounded" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-nexum-border/35">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="nexum-skeleton h-4 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-nexum-border/60 bg-nexum-bg-soft/50 px-5 py-4">
        <div className="nexum-skeleton h-9 w-full max-w-md rounded-xl" />
      </div>
    </div>
  );
}

export function NexumPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <NexumSkeleton className="h-3 w-32" />
        <NexumSkeleton className="h-8 w-64" />
        <NexumSkeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <NexumCardSkeleton key={i} />
        ))}
      </div>
      <NexumTableSkeleton />
    </div>
  );
}
