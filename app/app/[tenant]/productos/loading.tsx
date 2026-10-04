import { CatalogSkeleton } from "./catalog-panel";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <CatalogSkeleton />
    </div>
  );
}