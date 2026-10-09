import { createClient } from "@/lib/supabase/server";

const NAMES = [
  "Sales Account",
  "Purchase Account",
  "Output CGST",
  "Output SGST",
  "Output IGST",
  "Input CGST",
  "Input SGST",
  "Input IGST",
  "Round Off",
] as const;

export async function getSystemLedgerIds() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ledgers").select("id, name").in("name", NAMES);
  if (error) throw new Error(error.message);

  const byName = new Map((data ?? []).map((l) => [l.name, l.id]));
  const require = (name: (typeof NAMES)[number]) => {
    const id = byName.get(name);
    if (!id) throw new Error(`Missing required system ledger "${name}" — run supabase/seed.sql`);
    return id;
  };

  return {
    salesAccountId: require("Sales Account"),
    purchaseAccountId: require("Purchase Account"),
    outputCgstId: require("Output CGST"),
    outputSgstId: require("Output SGST"),
    outputIgstId: require("Output IGST"),
    inputCgstId: require("Input CGST"),
    inputSgstId: require("Input SGST"),
    inputIgstId: require("Input IGST"),
    roundOffId: require("Round Off"),
  };
}

/** Cash-in-hand and bank ledgers — the places money can be received into or paid from. */
export async function getMoneyAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_with_nature")
    .select("id, name, group_name")
    .in("group_name", ["Cash-in-Hand", "Bank Accounts"])
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  // Cash first: it is the default for counter sales
  return (data ?? [])
    .map((l) => ({ id: l.id, name: l.name, isCash: l.group_name === "Cash-in-Hand" }))
    .sort((a, b) => Number(b.isCash) - Number(a.isCash));
}

export type MoneyAccount = Awaited<ReturnType<typeof getMoneyAccounts>>[number];
