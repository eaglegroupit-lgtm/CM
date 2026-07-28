import type { UserRole } from "@/types/database";

export interface NavItem {
  title: string;
  url: string;
  roles: UserRole[];
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
    title: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", roles: ALL }],
  },
  {
    title: "Vouchers",
    items: [
      { title: "Sales", url: "/vouchers/sales", roles: ALL },
      { title: "Purchase", url: "/vouchers/purchase", roles: FINANCE },
      { title: "Payment", url: "/vouchers/payment", roles: FINANCE },
      { title: "Receipt", url: "/vouchers/receipt", roles: FINANCE },
      { title: "Journal", url: "/vouchers/journal", roles: FINANCE },
      { title: "Contra", url: "/vouchers/contra", roles: FINANCE },
      { title: "Debit Note", url: "/vouchers/debit-note", roles: FINANCE },
      { title: "Credit Note", url: "/vouchers/credit-note", roles: FINANCE },
    ],
  },
  {
    title: "Masters",
    items: [
      { title: "Groups", url: "/masters/groups", roles: FINANCE },
      { title: "Ledgers", url: "/masters/ledgers", roles: ALL },
      { title: "Stock Items", url: "/masters/stock-items", roles: FINANCE },
      { title: "Godowns", url: "/masters/godowns", roles: FINANCE },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "Day Book", url: "/reports/day-book", roles: ALL },
      { title: "Ledger", url: "/reports/ledger", roles: FINANCE },
      { title: "Trial Balance", url: "/reports/trial-balance", roles: FINANCE },
      { title: "Profit & Loss", url: "/reports/profit-and-loss", roles: FINANCE },
      { title: "Balance Sheet", url: "/reports/balance-sheet", roles: FINANCE },
      { title: "Stock Summary", url: "/reports/stock-summary", roles: ALL },
      { title: "Outstanding", url: "/reports/outstanding", roles: FINANCE },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Company", url: "/settings/company", roles: OWNER_ONLY },
      { title: "Users", url: "/settings/users", roles: OWNER_ONLY },
    ],
  },
];

export function navForRole(role: UserRole): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}
