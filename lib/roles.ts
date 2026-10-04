import type { OrganizationRole } from "@/lib/types";

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  CASHIER: "Cajero",
};

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

export function roleLabel(role: OrganizationRole | string): string {
  return ROLE_LABELS[role as OrganizationRole] ?? role;
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

export function roleOptions(
  role: OrganizationRole | null,
): { value: OrganizationRole; label: string }[] {
  return grantableRoles(role).map((value) => ({ value, label: ROLE_LABELS[value] }));
}