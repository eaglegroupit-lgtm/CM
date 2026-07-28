"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StockItemType } from "@/types/database";

export interface StockItemInput {
  name: string;
  category_id: string;
  item_type: StockItemType;
  unit_id: string;
  hsn_code?: string;
  gst_rate: number;
  standard_rate: number;
  low_stock_qty: number;
  tracks_lots: boolean;
  thickness_mm?: number;
  finish?: string;
  color?: string;
  size?: string;
  brand?: string;
  opening_qty: number;
  opening_value: number;
}

export async function createStockItem(input: StockItemInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("stock_items").insert(input);
  if (error) throw new Error(error.message);
  revalidatePath("/masters/stock-items");
}
