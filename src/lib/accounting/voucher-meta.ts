export type VoucherKind = "trading" | "financial";

export interface VoucherMeta {
  code: string;
  label: string;
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
    label: "Sales",
    kind: "trading",
    partySide: "debit",
    affectsInventory: true,
    affectsTax: true,
    stockMoveDirection: "out",
  },
  PURC: {
    code: "PURC",
    label: "Purchase",
    kind: "trading",
    partySide: "credit",
    affectsInventory: true,
    affectsTax: true,
    stockMoveDirection: "in",
  },
  CNOTE: {
    code: "CNOTE",
    label: "Credit Note",
    kind: "trading",
    partySide: "credit",
    affectsInventory: true,
    affectsTax: true,
    stockMoveDirection: "in",
  },
  DNOTE: {
    code: "DNOTE",
    label: "Debit Note",
    kind: "trading",
    partySide: "debit",
    affectsInventory: true,
    affectsTax: true,
    stockMoveDirection: "out",
  },
  PMT: {
    code: "PMT",
    label: "Payment",
    kind: "financial",
    billDirection: "payable",
    affectsInventory: false,
    affectsTax: false,
  },
  RCPT: {
    code: "RCPT",
    label: "Receipt",
    kind: "financial",
    billDirection: "receivable",
    affectsInventory: false,
    affectsTax: false,
  },
  JRNL: {
    code: "JRNL",
    label: "Journal",
    kind: "financial",
    affectsInventory: false,
    affectsTax: false,
  },
  CONT: {
    code: "CONT",
    label: "Contra",
    kind: "financial",
    affectsInventory: false,
    affectsTax: false,
  },
};
