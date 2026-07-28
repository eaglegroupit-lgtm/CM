import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GstInvoiceDocument } from "@/components/pdf/gst-invoice";
import type { StockItem, VoucherInventoryEntry } from "@/types/database";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: voucher } = await supabase.from("vouchers").select("*, ledgers(*)").eq("id", id).single();
  if (!voucher) {
    return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  }

  const [{ data: company }, { data: invLines }, { data: taxDetails }] = await Promise.all([
    supabase.from("company_settings").select("*").single(),
    supabase.from("voucher_inventory_entries").select("*, stock_items(*)").eq("voucher_id", id),
    supabase.from("voucher_tax_details").select("*").eq("voucher_id", id),
  ]);

  const party = (voucher as unknown as { ledgers: import("@/types/database").Ledger | null }).ledgers;
  if (!company || !party) {
    return NextResponse.json({ error: "Missing company or party details" }, { status: 400 });
  }

  const lines = (invLines ?? []) as unknown as (VoucherInventoryEntry & { stock_items: StockItem })[];
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);

  const buffer = await renderToBuffer(
    GstInvoiceDocument({
      data: {
        company,
        voucherNo: voucher.voucher_no,
        voucherDate: voucher.voucher_date,
        party,
        isInterstate: voucher.is_interstate,
        lines: lines.map((l) => ({ ...l, item: l.stock_items })),
        taxDetails: taxDetails ?? [],
        subtotal,
        totalAmount: voucher.total_amount,
      },
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${voucher.voucher_no.replace(/\//g, "-")}.pdf"`,
    },
  });
}
