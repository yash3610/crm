import { Card } from "@/components/common/Primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeaderSkeleton({ actions = 2 }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-[70vw]" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: actions }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28" />
        ))}
      </div>
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }) {
  return (
    <div
      className={cn(
        "mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2",
        count >= 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="flex items-start justify-between p-5">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </Card>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-24" />
          <Skeleton className="mt-6 h-64 w-full rounded-xl" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-3 w-36" />
          <Skeleton className="mx-auto mt-6 h-52 w-52 rounded-full" />
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="space-y-4 p-5 xl:col-span-2">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 border-t pt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </Card>
        <Card className="space-y-4 p-5">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="h-2 w-2 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

export function DetailPageSkeleton({ document = false }) {
  return (
    <>
      <PageHeaderSkeleton actions={3} />
      <div className={cn("grid gap-4", document && "xl:grid-cols-[1fr_320px]")}>
        <Card className="space-y-6 p-6">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-14 w-28" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
          <div className="ml-auto w-full max-w-xs space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
        </Card>
        {document && (
          <Card className="space-y-4 p-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </Card>
        )}
      </div>
    </>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-4 lg:block">
        <div className="flex gap-3 border-b pb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <Skeleton className="mt-4 h-10 w-full" />
        <div className="mt-5 space-y-2">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between border-b p-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-32 w-full rounded-xl md:col-span-2" />
        </div>
      </main>
    </div>
  );
}

export function NotificationListSkeleton({ count = 6 }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-4 p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 border-r border-border p-4 lg:block">
        <Skeleton className="h-10 w-36" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex-1">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Skeleton className="h-9 w-72" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <DashboardSkeleton />
        </div>
      </div>
    </div>
  );
}
