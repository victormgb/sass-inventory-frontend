import type { ReactNode } from "react";

const TONES = {
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
} as const;

type BadgeProps = {
  tone?: keyof typeof TONES;
  children: ReactNode;
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
