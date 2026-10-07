import { Skeleton } from "@/components/ui/skeleton";

/**
 * The label arrives as a prop rather than being translated here: this renders in a
 * Suspense fallback position, and a component that has to await a cookie to paint a
 * placeholder is a component that can suspend where it cannot.
 */
export function KpiGridSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-full">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
            <Skeleton className="size-10 shrink-0 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
