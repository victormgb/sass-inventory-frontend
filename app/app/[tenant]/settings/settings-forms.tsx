"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, ImageUp, Loader2, Save, Trash2 } from "lucide-react";

import {
  deleteOrganizationAction,
  removeOrganizationLogoAction,
  updateOrganizationAction,
  type SettingsState,
} from "@/lib/auth/organization-settings-actions";
import { MAX_LOGO_BYTES, type FieldErrors } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";

import { OrganizationLogo } from "@/components/layout/organization-logo";

const initialState: SettingsState = {};

type UploadPayload = {
  message?: string;
  errors?: FieldErrors;
};

/**
 * Identity form: the name only.
 *
 * The logo has its own form because an upload cannot travel in the JSON body the
 * rest of the settings use.
 */
export function OrganizationForm({ name }: { name: string }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(updateOrganizationAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="organization-name"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {t("settings.identity.nameLabel")}
        </label>
        <input
          id="organization-name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          defaultValue={name}
          aria-invalid={state.fieldErrors?.name ? true : undefined}
          className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
        />
        {state.fieldErrors?.name ? (
          <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <StateMessages state={state} />

      <SaveButton />
    </form>
  );
}

/**
 * Logo upload.
 *
 * Posts to a Route Handler rather than using a Server Action. Both keep the token
 * on the server, but an action buffers the file inside the request body, which is
 * capped at 1MB and rejects with a digest error naming neither the field nor the
 * limit; the route handler forwards the multipart body as it arrives. See
 * app/api/organizations/logo/route.ts.
 *
 * The preview shows the picked file before anything is sent, so a wrong pick is
 * caught without a round trip. It is a blob URL rather than the stored one, and it
 * is revoked when the selection changes or the component unmounts: a blob URL pins
 * the whole file in memory for the life of the document, and a settings page opened
 * repeatedly would otherwise accumulate every image ever picked.
 */
export function OrganizationLogoForm({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [removeState, removeAction] = useActionState(
    removeOrganizationLogoAction,
    initialState,
  );
  const [uploadState, setUploadState] = useState<SettingsState>({});
  const [uploading, setUploading] = useState(false);
  const [selection, setSelection] = useState<{ name: string; url: string } | null>(null);
  const [renderedUrl, setRenderedUrl] = useState(logoUrl);

  // A successful upload revalidates the page, so logoUrl comes back as the stored
  // S3 URL instead of whatever it was. That change is the server confirming it took
  // the file, and it is what clears the picker: an input of type file cannot be
  // emptied by assigning to its value, so the form is keyed on the URL and a new
  // one starts empty. Adjusted during render rather than in an effect, which would
  // cost a second cascading render to reach the same state.
  if (logoUrl !== renderedUrl) {
    setRenderedUrl(logoUrl);
    setSelection(null);
  }

  useEffect(() => {
    if (!selection) {
      return;
    }

    const url = selection.url;

    return () => URL.revokeObjectURL(url);
  }, [selection]);

  const previewUrl = selection?.url ?? logoUrl;

  async function uploadLogo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = event.currentTarget.elements.namedItem("logo");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;

    if (!file) {
      setUploadState({ fieldErrors: { logo: [t("settings.logo.selectImage")] } });

      return;
    }

    // Same cap the API enforces. This only saves the round trip and names the
    // limit; the server is still what decides.
    if (file.size > MAX_LOGO_BYTES) {
      setUploadState({ fieldErrors: { logo: [t("settings.logo.tooLarge")] } });

      return;
    }

    const body = new FormData();
    body.set("logo", file);

    setUploading(true);
    setUploadState({});

    try {
      const response = await fetch("/api/organizations/logo", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as UploadPayload;

      if (response.status === 401) {
        router.replace("/login");

        return;
      }

      if (!response.ok) {
        setUploadState(
          payload.errors
            ? { fieldErrors: payload.errors }
            : { error: payload.message ?? t("settings.logo.uploadFailed") },
        );

        return;
      }

      setUploadState({ success: t("settings.logo.uploaded") });
      router.refresh();
    } catch {
      setUploadState({ error: t("settings.logo.uploadFailed") });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        key={logoUrl ?? "sin-logo"}
        onSubmit={uploadLogo}
        className="space-y-4"
      >
        <div className="flex items-center gap-4">
          <OrganizationLogo name={name} logoUrl={previewUrl} size="lg" />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {name}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {selection
                ? selection.name
                : logoUrl
                  ? t("settings.logo.current")
                  : t("settings.logo.defaultMark")}
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="organization-logo"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            {t("settings.logo.label")}
          </label>
          <input
            id="organization-logo"
            name="logo"
            type="file"
            required
            accept="image/png,image/jpeg,image/webp"
            aria-describedby="logo-help"
            aria-invalid={uploadState.fieldErrors?.logo ? true : undefined}
            onChange={(event) => {
              const file = event.target.files?.[0];

              setSelection(
                file ? { name: file.name, url: URL.createObjectURL(file) } : null,
              );
            }}
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:file:bg-zinc-800 dark:file:text-zinc-200 dark:hover:file:bg-zinc-700 dark:focus:border-zinc-500"
          />
          <p id="logo-help" className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {t("settings.logo.help")}
          </p>
          {uploadState.fieldErrors?.logo ? (
            <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {uploadState.fieldErrors.logo[0]}
            </p>
          ) : null}
        </div>

        <StateMessages state={uploadState} />

        <UploadLogoButton pending={uploading} />
      </form>

      <form action={removeAction} className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          {t("settings.logo.removeHint")}
        </p>
        <StateMessages state={removeState} />
        <RemoveLogoButton disabled={logoUrl === null} />
      </form>
    </div>
  );
}

function StateMessages({ state }: { state: SettingsState }) {
  return (
    <>
      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          {state.success}
        </p>
      ) : null}
    </>
  );
}

function SaveButton() {
  const { t } = useI18n();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Save className="size-4" aria-hidden="true" />
      )}
      {t("settings.saveChanges")}
    </button>
  );
}

function UploadLogoButton({ pending }: { pending: boolean }) {
  const { t } = useI18n();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <ImageUp className="size-4" aria-hidden="true" />
      )}
      {t("settings.logo.upload")}
    </button>
  );
}

function RemoveLogoButton({ disabled }: { disabled: boolean }) {
  const { t } = useI18n();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="size-4" aria-hidden="true" />
      )}
      {t("settings.logo.remove")}
    </button>
  );
}

/**
 * Deleting the tenant.
 *
 * The confirmation asks for the slug rather than the displayed name on purpose:
 * the slug is what never changes, so the text cannot go stale under the user
 * (rename the company in another tab and the prompt still matches), and the server
 * compares it against the tenant cookie instead of trusting a posted field.
 */
export function DeleteOrganizationForm({ slug }: { slug: string }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(deleteOrganizationAction, initialState);
  const [confirmation, setConfirmation] = useState("");

  const matches = confirmation.trim() === slug;

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
        <p className="text-sm text-red-800 dark:text-red-200">
          {t("settings.danger.warning")}
        </p>
      </div>

      <div>
        <label
          htmlFor="confirm-name"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {t("settings.danger.confirmLabelStart")}{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">{slug}</code>{" "}
          {t("settings.danger.confirmLabelEnd")}
        </label>
        <input
          id="confirm-name"
          name="confirm_name"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          aria-invalid={confirmation !== "" && !matches ? true : undefined}
          className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <DeleteButton enabled={matches} />
    </form>
  );
}

function DeleteButton({ enabled }: { enabled: boolean }) {
  const { t } = useI18n();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || !enabled}
      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="size-4" aria-hidden="true" />
      )}
      {t("settings.danger.submit")}
    </button>
  );
}