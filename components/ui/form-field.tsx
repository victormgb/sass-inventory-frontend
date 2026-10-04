import type { LucideIcon } from "lucide-react";

const inputClasses =
  "block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20";

const iconClasses =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400";

export type FormFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  icon: LucideIcon;
  defaultValue?: string;
  hint?: string;
  errors?: string[];
  step?: string;
  min?: string;
  max?: string;
  inputMode?: "text" | "numeric" | "decimal";
  className?: string;
};

/**
 * Labelled input with an icon, wired for assistive tech: `aria-invalid` when the
 * field failed validation and `aria-describedby` pointing at the message, so the
 * error is announced instead of only being seen.
 */
export function FormField({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
  required,
  icon: Icon,
  defaultValue,
  hint,
  errors,
  step,
  min,
  max,
  inputMode,
  className,
}: FormFieldProps) {
  const hasError = Boolean(errors?.length);
  const describedBy = hasError ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      <div className="relative">
        <Icon className={iconClasses} aria-hidden="true" />
        <input
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          step={step}
          min={min}
          max={max}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={`${inputClasses} ${className ?? ""} ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
        />
      </div>
      {hasError ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {errors?.[0]}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type TextAreaFieldProps = {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
  errors?: string[];
};

/**
 * Same error wiring as FormField. `defaultValue` rather than `value` because the
 * form is uncontrolled: a controlled textarea would need a value/onChange pair
 * that only exists to satisfy React.
 */
export function TextAreaField({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  rows = 3,
  hint,
  errors,
}: TextAreaFieldProps) {
  const hasError = Boolean(errors?.length);
  const describedBy = hasError ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-500/20 ${
          hasError
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:ring-zinc-500"
        }`}
      />
      {hasError ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {errors?.[0]}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}