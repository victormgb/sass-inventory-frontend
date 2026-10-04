"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";

type LogoSize = "sm" | "lg";

const SIZES: Record<LogoSize, string> = {
  sm: "size-8",
  lg: "size-20",
};

/**
 * Organization logo, with a generated mark when none is configured.
 *
 * A null logo_url is the normal case, not an error: an <img> with no source
 * renders as a broken-image icon, so the fallback is what most users actually see.
 *
 * Client component because a configured URL can fail to load at any time (host
 * down, hotlink blocked, typo in the path). The error is handled by falling back
 * to the mark, which is the same thing a null logo shows, instead of leaving a
 * broken image behind.
 *
 * Which URL failed is remembered rather than a bare "something failed" flag: a flag
 * would latch, so replacing a logo that failed to load would keep showing the
 * placeholder over the new one, which is the opposite of what happened.
 */
export function OrganizationLogo({
  name,
  logoUrl,
  size = "sm",
}: {
  name: string;
  logoUrl: string | null;
  size?: LogoSize;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const showImage = logoUrl !== null && logoUrl !== "" && failedUrl !== logoUrl;

  if (!showImage) {
    return (
      <span
        aria-hidden="true"
        className={`flex ${SIZES[size]} shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900`}
      >
        <Building2 className={size === "lg" ? "size-8" : "size-4"} />
      </span>
    );
  }

  return (
    // Plain img on purpose: next/image would need the host allowlisted up front,
    // and a logo is an arbitrary URL the user typed.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={`Logo de ${name}`}
      onError={() => setFailedUrl(logoUrl)}
      className={`${SIZES[size]} shrink-0 rounded-lg bg-white object-contain`}
    />
  );
}