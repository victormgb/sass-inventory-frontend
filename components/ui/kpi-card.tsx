import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "warning";
};

const toneClasses = {
  default: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  warning: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
} as const;

export function KpiCard({ label, value, hint, icon: Icon, tone = "default" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-500">{hint}</p>
          ) : null}
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
