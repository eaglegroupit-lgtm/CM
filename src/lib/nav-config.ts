import type { UserRole } from "@/types/database";

/** Icon keys are resolved to components inside the (client) sidebar — components can't cross the RSC boundary. */
export type NavIcon =
  | "home"
  | "sale"
  | "purchase"
  | "money-in"
  | "money-out"
  | "sale-return"
  | "purchase-return"
  | "items"
  | "customers"
  | "suppliers"
  | "accounts"
  | "day-book"
  | "statement"
  | "stock"
  | "pending"
  | "profit"
  | "balance-sheet"
  | "shop"
  | "users"
  | "guide";

export interface NavItem {
  title: string;
  url: string;
  icon: NavIcon;
  roles: UserRole[];
  /** Opens in a new tab (static pages outside the app shell). */
  external?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const ALL: UserRole[] = ["owner", "accountant", "sales_staff"];
const FINANCE: UserRole[] = ["owner", "accountant"];
const OWNER_ONLY: UserRole[] = ["owner"];

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Home",
    items: [{ title: "Dashboard", url: "/dashboard", icon: "home", roles: ALL }],
  },
  {
    title: "Daily Entries",
    items: [
      { title: "New Sale (Bill)", url: "/vouchers/sales", icon: "sale", roles: ALL },
      { title: "Purchase", url: "/vouchers/purchase", icon: "purchase", roles: FINANCE },
      { title: "Money Received", url: "/vouchers/receipt", icon: "money-in", roles: FINANCE },
      { title: "Money Paid / Expenses", url: "/vouchers/payment", icon: "money-out", roles: FINANCE },
      { title: "Sales Return", url: "/vouchers/credit-note", icon: "sale-return", roles: FINANCE },
      { title: "Purchase Return", url: "/vouchers/debit-note", icon: "purchase-return", roles: FINANCE },
    ],
  },
  {
    title: "Items & Parties",
    items: [
      { title: "Items & Stock", url: "/masters/stock-items", icon: "items", roles: FINANCE },
      { title: "Customers", url: "/masters/customers", icon: "customers", roles: ALL },
      { title: "Suppliers", url: "/masters/suppliers", icon: "suppliers", roles: FINANCE },
      { title: "Cash, Bank & Expenses", url: "/masters/ledgers", icon: "accounts", roles: FINANCE },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "All Entries (Day Book)", url: "/reports/day-book", icon: "day-book", roles: ALL },
      { title: "Party Statement", url: "/reports/ledger", icon: "statement", roles: FINANCE },
      { title: "Stock Report", url: "/reports/stock-summary", icon: "stock", roles: ALL },
      { title: "Pending Payments", url: "/reports/outstanding", icon: "pending", roles: FINANCE },
      { title: "Profit & Loss", url: "/reports/profit-and-loss", icon: "profit", roles: FINANCE },
      { title: "Balance Sheet", url: "/reports/balance-sheet", icon: "balance-sheet", roles: FINANCE },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Shop Details", url: "/settings/company", icon: "shop", roles: OWNER_ONLY },
      { title: "Users & Staff", url: "/settings/users", icon: "users", roles: OWNER_ONLY },
    ],
  },
  {
    title: "Help",
    items: [{ title: "How to Use (Guide)", url: "/guide", icon: "guide", roles: ALL, external: true }],
  },
];

export function navForRole(role: UserRole): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}
