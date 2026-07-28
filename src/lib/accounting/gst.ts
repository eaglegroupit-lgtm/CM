export interface GstSplit {
  isInterstate: boolean;
  cgst: number;
  sgst: number;
  igst: number;
}

/**
 * Splits a GST amount into CGST+SGST (intra-state) or IGST (inter-state) based on whether the
 * party's state matches the seller's home state (Tamil Nadu for Kovai Marbles & Granites).
 */
export function splitGst(taxableValue: number, gstRate: number, isInterstate: boolean): GstSplit {
  const totalTax = round2((taxableValue * gstRate) / 100);
  if (isInterstate) {
    return { isInterstate, cgst: 0, sgst: 0, igst: totalTax };
  }
  const half = round2(totalTax / 2);
  return { isInterstate, cgst: half, sgst: totalTax - half, igst: 0 };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function isInterstateSupply(homeState: string, partyState: string | null | undefined): boolean {
  if (!partyState) return false;
  return partyState.trim().toLowerCase() !== homeState.trim().toLowerCase();
}
