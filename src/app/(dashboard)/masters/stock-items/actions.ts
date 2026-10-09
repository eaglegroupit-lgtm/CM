"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface StockItemInput {
  name: string;
  category_id: string;
  unit_id: string;
  brand?: string;
  size?: string;
  thickness_mm?: number;
  hsn_code?: string;
  gst_rate: number;
  standard_rate: number;
  purchase_rate: number;
  opening_qty: number;
  low_stock_qty: number;
}

export async function createStockItem(input: StockItemInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("stock_items").insert({
    ...input,
    brand: input.brand || null,
    size: input.size || null,
    hsn_code: input.hsn_code || null,
    thickness_mm: input.thickness_mm ?? null,
    item_type: "simple",
    tracks_lots: false,
    // Opening stock is valued at cost so the stock value and profit figures stay meaningful
    opening_value: Math.round(input.opening_qty * input.purchase_rate * 100) / 100,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/masters/stock-items");
  revalidatePath("/vouchers", "layout");
}
