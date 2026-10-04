"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, ImageUp, Loader2, Save, Trash2 } from "lucide-react";

import {
  deleteOrganizationAction,
  removeOrganizationLogoAction,
  updateOrganizationAction,
  uploadOrganizationLogoAction,
  type SettingsState,
} from "@/lib/auth/organization-settings-actions";

import { OrganizationLogo } from "@/components/layout/organization-logo";

const initialState: SettingsState = {};

/**
 * Identity form: the name only.
 *
 * The logo has its own form because an upload cannot travel in the JSON body the
 * rest of the settings use.
 */
export function OrganizationForm({ name }: { name: string }) {
  const [state, formAction] = useActionState(updateOrganizationAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="organization-name"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Nombre
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
  const [uploadState, uploadAction] = useActionState(
    uploadOrganizationLogoAction,
    initialState,
  );
  const [removeState, removeAction] = useActionState(
    removeOrganizationLogoAction,
    initialState,
  );
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

  return (
    <div className="space-y-5">
      <form key={logoUrl ?? "sin-logo"} action={uploadAction} className="space-y-4">
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
                  ? "Logo actual"
                  : "Sin logo: se usa la marca por defecto."}
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="organization-logo"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Imagen del logo
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
            JPG, PNG o WebP. Hasta 2 MB y 2048 px de lado mayor.
          </p>
          {uploadState.fieldErrors?.logo ? (
            <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {uploadState.fieldErrors.logo[0]}
            </p>
          ) : null}
        </div>

        <StateMessages state={uploadState} />

        <UploadLogoButton />
      </form>

      <form action={removeAction} className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Quitar el logo lo elimina del almacenamiento y vuelve a la marca por defecto.
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
      Guardar cambios
    </button>
  );
}

function UploadLogoButton() {
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
        <ImageUp className="size-4" aria-hidden="true" />
      )}
      Subir logo
    </button>
  );
}

function RemoveLogoButton({ disabled }: { disabled: boolean }) {
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
      Quitar logo
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
          Esto elimina la organización, sus miembros, su catálogo y todas sus
          ventas. No se puede deshacer.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirm-name"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Escribe <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">{slug}</code> para confirmar
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
      Eliminar organización
    </button>
  );
}