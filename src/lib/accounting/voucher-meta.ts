export type VoucherKind = "trading" | "financial";

export interface VoucherMeta {
  code: string;
  label: string;
  /** App route of this voucher's entry page (revalidated after posting). */
  path: string;
  kind: VoucherKind;
  /** For 'trading': which side of the double entry the party ledger sits on. */
  partySide?: "debit" | "credit";
  /** For 'financial' vouchers with a party: which outstanding-bill list to offer. */
  billDirection?: "receivable" | "payable";
  affectsInventory: boolean;
  affectsTax: boolean;
  stockMoveDirection?: "in" | "out";
}

export const VOUCHER_META: Record<string, VoucherMeta> = {
  SALE: {
    code: "SALE",
    label: "Sale",
    path: "/vouchers/sales",
    kind: "trading",
    partySide: "debit",
    affectsInventory: true,
    affectsTax: true,
    stockMoveDirection: "out",
  },
  PURC: {
    code: "PURC",
    label: "Purchase",
    path: "/vouchers/purchase",
    kind: "trading",
    partySide: "credit",
    affectsInventory: true,
    affectsTax: true,
    stockMoveDirection: "in",
  },
  CNOTE: {
    code: "CNOTE",
    label: "Sales Return",
    path: "/vouchers/credit-note",
    kind: "trading",
    partySide: "credit",
    affectsInventory: true,
    affectsTax: true,
    stockMoveDirection: "in",
  },
  DNOTE: {
    code: "DNOTE",
    label: "Purchase Return",
    path: "/vouchers/debit-note",
    kind: "trading",
    partySide: "debit",
    affectsInventory: true,
    affectsTax: true,
    stockMoveDirection: "out",
  },
  PMT: {
    code: "PMT",
    label: "Payment",
    path: "/vouchers/payment",
    kind: "financial",
    billDirection: "payable",
    affectsInventory: false,
    affectsTax: false,
  },
  RCPT: {
    code: "RCPT",
    label: "Receipt",
    path: "/vouchers/receipt",
    kind: "financial",
    billDirection: "receivable",
    affectsInventory: false,
    affectsTax: false,
  },
};
