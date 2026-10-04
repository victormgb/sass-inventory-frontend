export type Organization = {
  id: number;
  name: string;
  slug: string;
  /**
   * null means no logo configured. The UI renders a generated mark in that case
   * rather than an <img> whose source would fail to load.
   */
  logo_url: string | null;
};

export type AuthUser = {
  id: number;
  full_name: string;
  email: string;
};

export type OrganizationRole = "ADMIN" | "MANAGER" | "CASHIER";

export type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  organization_name: string;
};

export type RegisterResponse = {
  token: string;
  user: AuthUser;
  organization: Organization;
  role: OrganizationRole;
};

export type LoginPayload = {
  email: string;
  password: string;
  /**
   * Optional. The API picks the user's most recent membership when omitted, so
   * this only matters for accounts that belong to more than one organization.
   */
  organization_slug?: string;
};

/**
 * One of the organizations the signed-in user belongs to, with the role they
 * hold *there*.
 *
 * The role is per organization on purpose: the same account can be ADMIN in one
 * and CASHIER in another, so the session's own role cannot stand in for this
 * once the user switches.
 */
export type SessionOrganization = {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  role: OrganizationRole;
  role_label: string;
  joined_at: string | null;
};

export type OrganizationListResponse = {
  data: SessionOrganization[];
};

export type CreateOrganizationResponse = {
  data: Organization;
  role: OrganizationRole;
};

export type UpdateOrganizationResponse = {
  data: Organization;
};

/**
 * The delete response carries what the user still belongs to, so the session can
 * be moved somewhere that exists instead of leaving the tenant cookie pointing at
 * a deleted organization.
 */
export type DeleteOrganizationResponse = {
  deleted: boolean;
  organizations: SessionOrganization[];
};

export type UpdateOrganizationPayload = {
  name: string;
  logo_url?: string | null;
};

/**
 * Same shape as the register response: login also has to tell the BFF which
 * tenant the new token belongs to. `organizations` drives the tenant switcher
 * and the organization picker, so a fresh login never has to re-fetch them.
 */
export type LoginResponse = RegisterResponse & {
  organizations: SessionOrganization[];
};

export type MeResponse = {
  user: AuthUser;
  organization: Organization;
  role: OrganizationRole | null;
  organizations: SessionOrganization[];
};

export type DashboardSummary = {
  organization: Organization;
  metrics: {
    total_products: number;
    low_stock_products: number;
    orders_today: number;
    revenue_today: string;
  };
};

export type FieldErrors = Record<string, string[]>;

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export type Member = {
  id: number;
  role: OrganizationRole;
  role_label: string;
  user: AuthUser;
  joined_at: string | null;
};

export type Invitation = {
  id: number;
  email: string;
  role: OrganizationRole;
  role_label: string;
  status: InvitationStatus;
  expires_at: string;
  invited_by: { id: number; full_name: string };
  created_at: string | null;
};

export type MembersResponse = {
  data: Member[];
};

export type InvitationsResponse = {
  data: Invitation[];
};

export type InvitePayload = {
  email: string;
  role: OrganizationRole;
};

export type CreateInvitationResponse = {
  data: Invitation;
  accept_url: string | null;
};

export type InvitationPreview = {
  email: string;
  role: OrganizationRole;
  role_label: string;
  organization: Organization;
  expires_at: string;
  user_exists: boolean;
};

export type InvitationPreviewResponse = {
  data: InvitationPreview;
};

export type AcceptInvitationPayload = {
  token: string;
  full_name: string;
  password: string;
  password_confirmation: string;
};

export type AcceptInvitationResponse = {
  token: string;
  user: AuthUser;
  organization: Organization;
  role: OrganizationRole;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  /**
   * Strings, not numbers: Laravel serialises decimal(12,2) as a string so money
   * never round-trips through a binary float. formatCurrency parses for display.
   */
  price: string;
  cost_price: string;
  current_stock: number;
  min_stock_alert: number;
  is_low_on_stock: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type ProductPayload = {
  sku: string;
  name: string;
  description: string | null;
  price: string;
  cost_price: string;
  current_stock: number;
  min_stock_alert: number;
};

/** The Laravel pagination envelope (`data` + `links` + `meta`). */
export type PaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type ProductsResponse = {
  data: Product[];
  links: PaginationLinks;
  meta: PaginationMeta;
};

export type ProductResponse = {
  data: Product;
};

export type ProductSort =
  | "name"
  | "sku"
  | "price"
  | "cost_price"
  | "current_stock"
  | "created_at";

export type SortDirection = "asc" | "desc";

export type ProductQuery = {
  q?: string;
  low_stock?: boolean;
  sort?: ProductSort;
  direction?: SortDirection;
  page?: number;
  per_page?: number;
  edit?: number;
};

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

/**
 * Mirrors App\Enums\PaymentMethod in Laravel. Kept as a plain value here because
 * a "use server" module may only export async functions, so the option list the
 * client renders cannot live in the actions file.
 */
export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Efectivo" },
  { value: "CARD", label: "Tarjeta" },
  { value: "TRANSFER", label: "Transferencia" },
];

export type SaleStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";

export type SaleLine = {
  id: number;
  /** Null once the product is deleted; the snapshot below is what remains. */
  product_id: number | null;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: string;
  unit_cost: string;
  subtotal: string;
};

export type Sale = {
  id: number;
  order_number: string;
  status: SaleStatus;
  status_label: string;
  payment_method: PaymentMethod;
  payment_method_label: string;
  customer_name: string | null;
  total_amount: string;
  sold_by: { id: number; full_name: string } | null;
  items_count: number;
  /** Only present on the detail endpoint; the list omits it to stay small. */
  items?: SaleLine[];
  created_at: string | null;
};

export type SalesResponse = {
  data: Sale[];
  links: PaginationLinks;
  meta: PaginationMeta;
};

export type SaleResponse = {
  data: Sale;
};

/**
 * Only product_id and quantity travel to the API. Price and cost are read from
 * the catalog on the server, so a sale can never be registered at a price the
 * client chose.
 */
export type CreateSalePayload = {
  payment_method: PaymentMethod;
  customer_name: string | null;
  items: { product_id: number; quantity: number }[];
};

export type SaleSort = "created_at" | "total_amount" | "order_number";

export type SaleQuery = {
  q?: string;
  status?: SaleStatus;
  payment_method?: PaymentMethod;
  sort?: SaleSort;
  direction?: SortDirection;
  page?: number;
};
