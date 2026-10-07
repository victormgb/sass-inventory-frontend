import type { Translate } from "@/lib/i18n/types";
import type { OrganizationRole } from "@/lib/types";

/**
 * Mirrors App\Enums\OrganizationRole in Laravel.
 *
 * This is a UX mirror only: it stops the UI from offering a role the API would
 * refuse. Laravel stays authoritative and answers 403 regardless, so the two
 * lists can never disagree in a way that grants access.
 */
const GRANTABLE_ROLES: Record<OrganizationRole, readonly OrganizationRole[]> = {
  ADMIN: ["ADMIN", "MANAGER", "CASHIER"],
  MANAGER: ["CASHIER"],
  CASHIER: [],
};

/**
 * Display name for a role, resolved through the dictionary.
 *
 * Takes the translator rather than reading one itself: this module is imported by
 * Client Components, which cannot read cookies, and threading a translator through
 * every caller would be worse than the string lookup.
 *
 * The key is the enum value, never the translated text. These three strings are
 * what the API accepts as a role, so translating them would break the contract --
 * this only changes what the person reads.
 */
export function roleLabel(role: OrganizationRole | string, t: Translate): string {
  if (role === "ADMIN" || role === "MANAGER" || role === "CASHIER") {
    return t(`roles.${role}`);
  }

  return role;
}

export function grantableRoles(role: OrganizationRole | null): readonly OrganizationRole[] {
  return role ? GRANTABLE_ROLES[role] : [];
}

export function canInvite(role: OrganizationRole | null): boolean {
  return grantableRoles(role).length > 0;
}

/**
 * Mirrors App\Enums\OrganizationRole::canManageProducts in Laravel.
 *
 * ADMIN and MANAGER write, CASHIER reads only. Same caveat as GRANTABLE_ROLES:
 * hiding the form is UX, the API's authorize() is the actual gate.
 */
const PRODUCT_WRITERS: readonly OrganizationRole[] = ["ADMIN", "MANAGER"];

export function canManageProducts(role: OrganizationRole | null): boolean {
  return role !== null && PRODUCT_WRITERS.includes(role);
}

/**
 * Mirrors App\Enums\OrganizationRole::canRegisterSales in Laravel: every role
 * sells. Keeping the list here rather than returning true unconditionally means
 * a future role that cannot sell is a one-line change in the same place on both
 * sides.
 */
export function canRegisterSales(role: OrganizationRole | null): boolean {
  return role !== null;
}

/**
 * Mirrors App\Enums\OrganizationRole::canManageOrganization in Laravel.
 *
 * ADMIN only, and narrower than PRODUCT_WRITERS on purpose: editing the catalog
 * is ordinary work, but deleting the tenant takes every member, product and sale
 * with it, so it belongs to the account owner alone. Hiding the form is UX; the
 * Form Request's authorize() is the actual gate.
 */
export function canManageOrganization(role: OrganizationRole | null): boolean {
  return role === "ADMIN";
}

/**
 * Roles the current user may hand out, with translated labels.
 *
 * The value is the enum and the label is display copy, which is why this pairs a
 * wire value with a translated name rather than translating the list itself.
 */
export function roleOptions(
  role: OrganizationRole | null,
  t: Translate,
): { value: OrganizationRole; label: string }[] {
  return grantableRoles(role).map((value) => ({ value, label: roleLabel(value, t) }));
}