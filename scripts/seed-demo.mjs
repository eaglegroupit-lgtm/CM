// Demo data for a Coimbatore hardware & plywood shop: shop details, staff logins, items,
// Tamil Nadu customers & suppliers, and ~10 weeks of sales, purchases, receipts, payments,
// expenses and returns. Every entry is posted through create_voucher with the same GST /
// round-off maths as the app's forms, so reports, stock and pending bills all line up.
//
// Usage (against a freshly reset database):
//   npx supabase db reset
//   npm run seed:demo
//
// Reads NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
// from .env.local. Uses plain fetch (no supabase-js) so it runs on Node 18+.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

const USERS = [
  { email: "owner@shop.local", password: "Owner@123", full_name: "Murugesan K", role: "owner" },
  { email: "accounts@shop.local", password: "Accounts@123", full_name: "Lakshmi Priya", role: "accountant" },
  { email: "counter@shop.local", password: "Counter@123", full_name: "Ramesh Kumar", role: "sales_staff" },
];

// These two pay late, so "Pending Payments" and the ageing chart have overdue bills to show
const SLOW_PAYERS = ["Kannan Constructions", "Ganesh Furniture Mart"];

const START = "2026-08-01";
const END = "2026-10-09";
const HOME_STATE = "Tamil Nadu";

// ---------- tiny helpers ----------

let seed = 20261009;
const rand = () => {
  // mulberry32 — deterministic, so every run produces the same demo books
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function* days(from, to) {
  for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    yield new Date(d);
  }
}
const iso = (d) => d.toISOString().slice(0, 10);

let token = null;
async function api(path, { method = "GET", body, key = "user", prefer } = {}) {
  const bearer = key === "service" ? SERVICE : (token ?? ANON);
  const res = await fetch(`${URL_}${path}`, {
    method,
    headers: {
      apikey: key === "service" ? SERVICE : ANON,
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}
const select = (table, query = "") => api(`/rest/v1/${table}?${query}`);
const insert = (table, rows) => api(`/rest/v1/${table}`, { method: "POST", body: rows, prefer: "return=representation" });
const update = (table, query, patch) => api(`/rest/v1/${table}?${query}`, { method: "PATCH", body: patch });
const rpc = (fn, args) => api(`/rest/v1/rpc/${fn}`, { method: "POST", body: args });

// ---------- master data ----------

const SHOP = {
  name: "Sri Murugan Hardwares & Plywoods",
  address: "No. 214, Mettupalayam Road, Near Saibaba Colony Bus Stop, R.S. Puram",
  city: "Coimbatore",
  state: HOME_STATE,
  state_code: "33",
  pincode: "641043",
  phone: "+91 98431 52760",
  email: "srimuruganply@example.com",
  gstin: "33AKSPM4821L1ZQ",
  pan: "AKSPM4821L",
  bank_name: "City Union Bank",
  bank_account_no: "510909010045821",
  bank_ifsc: "CIUB0000214",
  bank_branch: "R.S. Puram, Coimbatore",
  invoice_terms:
    "Goods once sold will not be taken back or exchanged. Plywood cut to size is not returnable. Interest @ 18% p.a. on bills unpaid after due date. Subject to Coimbatore jurisdiction.",
};

// [name, category, unit, brand, size, thickness mm, hsn, gst, purchase, selling, opening qty, low-stock level, supplier key]
const ITEMS = [
  ["Club Plus BWP Plywood", "Plywood", "Sheet", "Greenply", "8x4 ft", 18, "4412", 18, 3150, 3650, 25, 10, "balaji"],
  ["Ecotec MR Plywood", "Plywood", "Sheet", "Greenply", "8x4 ft", 18, "4412", 18, 1850, 2250, 40, 15, "balaji"],
  ["Ecotec MR Plywood", "Plywood", "Sheet", "Greenply", "8x4 ft", 12, "4412", 18, 1420, 1720, 30, 12, "balaji"],
  ["Sainik MR Plywood", "Plywood", "Sheet", "CenturyPly", "8x4 ft", 12, "4412", 18, 1350, 1650, 35, 12, "bengaluru"],
  ["Club Prime BWP Plywood", "Plywood", "Sheet", "CenturyPly", "8x4 ft", 19, "4412", 18, 3400, 3950, 15, 8, "bengaluru"],
  ["Gold MR Plywood", "Plywood", "Sheet", "Kitply", "8x4 ft", 6, "4412", 18, 780, 950, 30, 10, "balaji"],
  ["Commercial Plywood", "Plywood", "Sheet", "Local", "8x4 ft", 9, "4412", 18, 720, 880, 40, 15, "balaji"],
  ["Block Board", "Block Board", "Sheet", "CenturyPly", "8x4 ft", 19, "4412", 18, 2650, 3100, 12, 5, "bengaluru"],
  ["HDHMR Pre-Lam Board", "MDF / HDF / Particle Board", "Sheet", "Action Tesa", "8x4 ft", 18, "4411", 18, 2300, 2750, 15, 6, "chennai"],
  ["Plain MDF Board", "MDF / HDF / Particle Board", "Sheet", "Rushil", "8x4 ft", 12, "4411", 18, 1200, 1450, 20, 8, "chennai"],
  ["Suede Finish Laminate", "Laminates & Veneers", "Sheet", "Merino", "8x4 ft", 1, "4823", 18, 1450, 1750, 40, 15, "chennai"],
  ["Gloss Laminate", "Laminates & Veneers", "Sheet", "Greenlam", "8x4 ft", 1, "4823", 18, 1550, 1900, 30, 12, "chennai"],
  ["Matt Laminate", "Laminates & Veneers", "Sheet", "Royale Touche", "8x4 ft", 0.8, "4823", 18, 950, 1200, 35, 12, "chennai"],
  ["Inner Liner Laminate", "Laminates & Veneers", "Sheet", "Virgo", "8x4 ft", 0.7, "4823", 18, 420, 520, 60, 20, "chennai"],
  ["Teak Veneer", "Laminates & Veneers", "Sheet", "Greenply", "8x4 ft", 0.5, "4408", 18, 2100, 2600, 8, 3, "chennai"],
  ["Flush Door", "Doors", "Nos", "Kongu", "7x3 ft", 30, "4418", 18, 3200, 3800, 10, 4, "kongu"],
  ["Membrane Door", "Doors", "Nos", "Kongu", "7x3 ft", 32, "4418", 18, 4500, 5400, 6, 2, "kongu"],
  ["Teak Wood Main Door", "Doors", "Nos", "Kongu", "7x3.5 ft", 40, "4418", 18, 18500, 22500, 2, 1, "kongu"],
  ["Auto Close Hinge 0 Crank", "Hinges & Channels", "Pcs", "Hettich", "35mm", null, "8302", 18, 95, 140, 200, 60, "vetri"],
  ["Auto Close Hinge 8 Crank", "Hinges & Channels", "Pcs", "Ebco", "35mm", null, "8302", 18, 85, 125, 150, 50, "vetri"],
  ["SS Butt Hinge", "Hinges & Channels", "Pair", "Annamalai", "4 inch", null, "8302", 18, 55, 80, 120, 40, "annamalai"],
  ["Telescopic Drawer Channel", "Hinges & Channels", "Pair", "Ebco", "18 inch", null, "8302", 18, 290, 380, 60, 20, "vetri"],
  ["Soft Close Drawer Channel", "Hinges & Channels", "Pair", "Hettich", "18 inch", null, "8302", 18, 780, 980, 30, 10, "vetri"],
  ["Mortise Lock with Handle", "Handles, Knobs & Locks", "Set", "Godrej", "8 lever", null, "8301", 18, 1650, 1950, 15, 5, "annamalai"],
  ["Cabinet Handle SS", "Handles, Knobs & Locks", "Pcs", "Dorset", "6 inch", null, "8302", 18, 120, 165, 150, 40, "annamalai"],
  ["Door Pull Handle SS", "Handles, Knobs & Locks", "Pcs", "Dorset", "12 inch", null, "8302", 18, 350, 450, 40, 12, "annamalai"],
  ["Padlock Brass", "Handles, Knobs & Locks", "Nos", "Europa", "50mm", null, "8301", 18, 420, 520, 30, 10, "annamalai"],
  ["Tower Bolt SS", "Handles, Knobs & Locks", "Pcs", "Annamalai", "8 inch", null, "8302", 18, 65, 95, 100, 30, "annamalai"],
  ["Magnetic Door Stopper", "Handles, Knobs & Locks", "Pcs", "Dorset", "Std", null, "8302", 18, 140, 190, 50, 15, "annamalai"],
  ["Wood Screw CSK", "Screws, Nails & Bolts", "Box", "GKW", "1.5 inch x100", null, "7318", 18, 180, 240, 80, 25, "annamalai"],
  ["Drywall Screw Black", "Screws, Nails & Bolts", "Box", "GKW", "2 inch x100", null, "7318", 18, 220, 290, 60, 20, "annamalai"],
  ["Wire Nails", "Screws, Nails & Bolts", "Kg", "Tata Wiron", "2 inch", null, "7317", 18, 85, 110, 150, 40, "annamalai"],
  ["Fevicol SH Adhesive", "Adhesives & Polish", "Nos", "Pidilite", "1 kg", null, "3506", 18, 380, 440, 60, 20, "annamalai"],
  ["Fevicol Marine Adhesive", "Adhesives & Polish", "Nos", "Pidilite", "1 kg", null, "3506", 18, 520, 600, 40, 15, "annamalai"],
  ["Melamine Polish Clear", "Adhesives & Polish", "Litre", "Asian Paints", "1 L", null, "3208", 18, 560, 650, 30, 10, "annamalai"],
  ["Araldite Standard", "Adhesives & Polish", "Nos", "Huntsman", "180 g", null, "3506", 18, 230, 280, 40, 12, "annamalai"],
  ["SS Kitchen Basket", "Kitchen & Wardrobe Fittings", "Set", "Hettich", "20x6x4 inch", null, "7323", 18, 1800, 2300, 20, 6, "vetri"],
  ["Tandem Drawer Box", "Kitchen & Wardrobe Fittings", "Set", "Hettich", "500mm", null, "8302", 18, 3800, 4600, 10, 3, "vetri"],
  ["Gas Strut Lift", "Kitchen & Wardrobe Fittings", "Pair", "Ebco", "120N", null, "8302", 18, 240, 320, 50, 15, "vetri"],
  ["Cutlery Tray", "Kitchen & Wardrobe Fittings", "Nos", "Ebco", "600mm", null, "3924", 18, 950, 1250, 15, 5, "vetri"],
  ["Wardrobe Hanger Rod", "Kitchen & Wardrobe Fittings", "Nos", "Ebco", "4 ft", null, "8302", 18, 260, 340, 30, 10, "vetri"],
  ["PVC Edge Band Tape", "Edge Band & Profiles", "Metre", "Rehau", "22mm x 0.8mm", null, "3916", 18, 9, 14, 1500, 400, "chennai"],
  ["Aluminium Profile Handle", "Edge Band & Profiles", "Nos", "Ebco", "3 m", null, "7604", 18, 650, 850, 25, 8, "vetri"],
  ["Impact Drill GSB 500", "Tools", "Nos", "Bosch", "500W", null, "8467", 18, 3100, 3699, 5, 2, "annamalai"],
  ["Measuring Tape", "Tools", "Nos", "Stanley", "5 m", null, "9017", 18, 210, 280, 25, 8, "annamalai"],
  ["Screwdriver Set", "Tools", "Set", "Taparia", "6 pcs", null, "8205", 18, 320, 420, 20, 6, "annamalai"],
  ["Sandpaper Sheet", "Other", "Pcs", "Norton", "No. 120", null, "6805", 18, 12, 20, 300, 100, "annamalai"],
];

// [name, place, state, gstin|null, credit days, kind]
//   kind: "contractor" buys plywood in bulk on credit; "carpenter" buys smaller mixed lots
const CUSTOMERS = [
  ["Murugan Interiors", "Gandhipuram, Coimbatore", HOME_STATE, "33AAMFM2214K1Z8", 30, "contractor"],
  ["Sri Lakshmi Furniture Works", "Ukkadam, Coimbatore", HOME_STATE, "33BCLPS6612H1ZK", 30, "contractor"],
  ["Selvam Carpentry Works", "Peelamedu, Coimbatore", HOME_STATE, null, 15, "carpenter"],
  ["Arul Modular Kitchens", "Saravanampatti, Coimbatore", HOME_STATE, "33AAKFA7781D1Z2", 30, "contractor"],
  ["Kannan Constructions", "R.S. Puram, Coimbatore", HOME_STATE, "33AAFCK5093M1ZP", 45, "contractor"],
  ["Velmurugan (Carpenter)", "Ganapathy, Coimbatore", HOME_STATE, null, 7, "carpenter"],
  ["Senthil Kumar R", "Vadavalli, Coimbatore", HOME_STATE, null, 7, "carpenter"],
  ["Anbu Wood Works", "Avinashi Road, Tiruppur", HOME_STATE, null, 15, "carpenter"],
  ["Karthikeyan Builders", "Pollachi", HOME_STATE, "33AAJFK3368E1ZB", 45, "contractor"],
  ["Ganesh Furniture Mart", "Mettupalayam", HOME_STATE, "33ADHPG4410N1ZT", 30, "contractor"],
  ["Rajeswari Home Decors", "Saibaba Colony, Coimbatore", HOME_STATE, null, 15, "carpenter"],
  ["Palanisamy M", "Thudiyalur, Coimbatore", HOME_STATE, null, 7, "carpenter"],
  ["Thirumalai Woodcraft", "Perundurai Road, Erode", HOME_STATE, "33AAPFT8857C1Z6", 30, "contractor"],
  ["Kumaravel Interior Designers", "Race Course, Coimbatore", HOME_STATE, "33ABZPK1934Q1ZF", 30, "contractor"],
  ["Muthu Carpenter", "Singanallur, Coimbatore", HOME_STATE, null, 7, "carpenter"],
  ["Shree Venkateshwara Interiors", "Hosur Road, Bengaluru", "Karnataka", "29AAQFS6125R1ZV", 30, "contractor"],
];

// key -> [name, place, state, gstin, credit days]
const SUPPLIERS = {
  balaji: ["Sri Balaji Plywoods", "Trichy Road, Coimbatore", HOME_STATE, "33AAHFS3390P1ZA", 30],
  chennai: ["Chennai Laminates Agency", "Parrys Corner, Chennai", HOME_STATE, "33AABFC7704G1Z9", 30],
  annamalai: ["Annamalai Hardware Distributors", "East Masi Street, Madurai", HOME_STATE, "33AAKPA2287F1ZH", 21],
  kongu: ["Kongu Timber & Doors", "Brough Road, Erode", HOME_STATE, "33AAEFK9921B1ZW", 30],
  vetri: ["Vetri Kitchen Fittings Agencies", "Kumaran Road, Tiruppur", HOME_STATE, "33AAOFV5568J1ZC", 21],
  bengaluru: ["Bengaluru Ply Depot", "Yeshwanthpur, Bengaluru", "Karnataka", "29AAGFB4416K1Z1", 30],
};

const phone = () => `9${randInt(4, 9)}${String(randInt(10000000, 99999999))}`;
const vehicle = () => `TN ${pick(["37", "38", "66", "99"])} ${pick(["AB", "BK", "CM", "DX", "AZ", "BY"])} ${randInt(1000, 9999)}`;

// ---------- main ----------

async function main() {
  const existing = await api("/rest/v1/stock_items?select=id&limit=1", { key: "service" });
  if (existing.length > 0) {
    throw new Error("Items already exist. Run `npx supabase db reset` first, then `npm run seed:demo`.");
  }

  // Logins (owner/accountant/counter staff) — role comes from user_metadata via handle_new_user()
  const authUsers = (await api("/auth/v1/admin/users?per_page=200", { key: "service" })).users;
  for (const u of USERS) {
    if (authUsers.some((a) => a.email === u.email)) continue;
    await api("/auth/v1/admin/users", {
      method: "POST",
      key: "service",
      body: { email: u.email, password: u.password, email_confirm: true, user_metadata: { full_name: u.full_name, role: u.role } },
    });
  }
  const session = await api("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email: USERS[0].email, password: USERS[0].password },
  });
  token = session.access_token;

  await update("company_settings", "id=eq.true", SHOP);

  const groups = Object.fromEntries((await select("account_groups", "select=id,name")).map((g) => [g.name, g.id]));
  const categories = Object.fromEntries((await select("stock_categories", "select=id,name")).map((c) => [c.name, c.id]));
  const units = Object.fromEntries((await select("units_of_measure", "select=id,name")).map((u) => [u.name, u.id]));

  // Opening cash/bank, balanced by the owner's capital so the Balance Sheet tallies
  await update("ledgers", "name=eq.Cash", { opening_balance: 35000, opening_balance_type: "debit" });
  await update("ledgers", "name=eq.Bank%20Account", {
    name: "City Union Bank - Current A/c",
    opening_balance: 400000,
    opening_balance_type: "debit",
    bank_account_no: SHOP.bank_account_no,
    bank_ifsc: SHOP.bank_ifsc,
  });
  await insert("ledgers", [
    {
      name: "Murugesan K - Capital",
      group_id: groups["Capital Account"],
      party_type: "none",
      opening_balance: 35000 + 400000,
      opening_balance_type: "credit",
    },
  ]);
  await insert("ledgers", [
    { name: "Cutting Charges", group_id: groups["Indirect Incomes"], party_type: "none", opening_balance: 0, opening_balance_type: "credit" },
  ]);

  const customers = await insert(
    "ledgers",
    CUSTOMERS.map(([name, place, state, gstin, creditDays]) => ({
      name,
      group_id: groups["Sundry Debtors"],
      party_type: "debtor",
      address: place,
      state,
      gstin,
      phone: phone(),
      credit_days: creditDays,
      credit_limit: gstin ? 200000 : 50000,
      opening_balance: 0,
      opening_balance_type: "debit",
    }))
  );
  const customerKind = Object.fromEntries(CUSTOMERS.map((c) => [c[0], c[5]]));

  const supplierRows = await insert(
    "ledgers",
    Object.values(SUPPLIERS).map(([name, place, state, gstin, creditDays]) => ({
      name,
      group_id: groups["Sundry Creditors"],
      party_type: "creditor",
      address: place,
      state,
      gstin,
      phone: phone(),
      credit_days: creditDays,
      opening_balance: 0,
      opening_balance_type: "credit",
    }))
  );
  const supplierByKey = Object.fromEntries(Object.keys(SUPPLIERS).map((k, i) => [k, supplierRows[i]]));

  const items = await insert(
    "stock_items",
    ITEMS.map(([name, cat, unit, brand, size, mm, hsn, gst, buy, sell, open, low]) => ({
      name,
      category_id: categories[cat],
      unit_id: units[unit],
      brand,
      size,
      thickness_mm: mm,
      hsn_code: hsn,
      gst_rate: gst,
      purchase_rate: buy,
      standard_rate: sell,
      opening_qty: open,
      opening_value: open * buy,
      low_stock_qty: low,
      item_type: "simple",
      tracks_lots: false,
    }))
  );
  items.forEach((it, i) => {
    it.supplier = ITEMS[i][12];
    it.sheet = ITEMS[i][2] === "Sheet" || ITEMS[i][1] === "Doors";
  });
  const stock = Object.fromEntries(items.map((it) => [it.id, it.opening_qty]));

  const ledgers = Object.fromEntries((await select("ledgers", "select=id,name")).map((l) => [l.name, l.id]));
  const godown = (await select("godowns", "select=id&is_default=eq.true"))[0].id;
  const CASH = ledgers["Cash"];
  const BANK = ledgers["City Union Bank - Current A/c"];
  const walkIn = ledgers["Walk-in Customer"];

  // ---------- voucher builders (same maths as trading-voucher-form.tsx) ----------

  const counts = {};
  async function post(payload) {
    const id = await rpc("create_voucher", { payload: { status: "posted", ...payload } });
    counts[payload.voucher_type_code] = (counts[payload.voucher_type_code] ?? 0) + 1;
    return id;
  }

  async function trade({ code, date, party, lines, settle = null, inclusive = false, ref, note, billId }) {
    const isOutward = code === "SALE" || code === "CNOTE";
    const partyDebits = code === "SALE" || code === "DNOTE";
    const interstate = (party.state ?? HOME_STATE) !== HOME_STATE;

    const calc = lines.map(({ item, qty, rate }) => {
      const gross = round2(qty * rate);
      const taxable = inclusive ? round2((gross * 100) / (100 + item.gst_rate)) : gross;
      const tax = round2((taxable * item.gst_rate) / 100);
      const cgst = interstate ? 0 : round2(tax / 2);
      return { item, qty, taxable, cgst, sgst: interstate ? 0 : round2(tax - cgst), igst: interstate ? tax : 0 };
    });
    const sum = (k) => round2(calc.reduce((s, c) => s + c[k], 0));
    const subtotal = sum("taxable");
    const [cgst, sgst, igst] = [sum("cgst"), sum("sgst"), sum("igst")];
    const exact = round2(subtotal + cgst + sgst + igst);
    const total = Math.round(exact);
    const roundOff = round2(total - exact);

    const line = (ledger_id, amount, onPartySide) => {
      const debit = onPartySide === partyDebits;
      return { ledger_id, debit_amount: debit ? amount : 0, credit_amount: debit ? 0 : amount };
    };
    const tax = isOutward
      ? [ledgers["Output CGST"], ledgers["Output SGST"], ledgers["Output IGST"]]
      : [ledgers["Input CGST"], ledgers["Input SGST"], ledgers["Input IGST"]];

    const entries = [line(settle ?? party.id, total, true), line(ledgers[isOutward ? "Sales Account" : "Purchase Account"], subtotal, false)];
    if (cgst > 0) entries.push(line(tax[0], cgst, false));
    if (sgst > 0) entries.push(line(tax[1], sgst, false));
    if (igst > 0) entries.push(line(tax[2], igst, false));
    if (roundOff > 0) entries.push(line(ledgers["Round Off"], roundOff, false));
    if (roundOff < 0) entries.push(line(ledgers["Round Off"], -roundOff, true));

    const payload = {
      voucher_type_code: code,
      voucher_date: date,
      party_ledger_id: party.id,
      reference_no: ref,
      narration: note,
      place_of_supply: party.state ?? HOME_STATE,
      is_interstate: interstate,
      total_amount: total,
      ledger_entries: entries,
      inventory_entries: calc.map((c) => ({
        stock_item_id: c.item.id,
        godown_id: godown,
        quantity: c.qty,
        rate: round2(c.taxable / c.qty),
        amount: c.taxable,
      })),
      tax_details: [
        cgst > 0 && { tax_type: "CGST", taxable_value: subtotal, rate: 0, amount: cgst },
        sgst > 0 && { tax_type: "SGST", taxable_value: subtotal, rate: 0, amount: sgst },
        igst > 0 && { tax_type: "IGST", taxable_value: subtotal, rate: 0, amount: igst },
      ].filter(Boolean),
    };
    if (!settle && billId) payload.bill_allocations = [{ bill_id: billId, amount: total }];
    else if (!settle) {
      const due = party.credit_days ? new Date(new Date(date).getTime() + party.credit_days * 86400000) : null;
      payload.new_bill = { due_date: due ? iso(due) : undefined };
    }

    const into = code === "PURC" || code === "CNOTE" ? 1 : -1;
    for (const c of calc) stock[c.item.id] = round2(stock[c.item.id] + into * c.qty);
    await post(payload);
    return total;
  }

  async function money({ mode, date, counterId, partyId, amount, account, ref, note }) {
    const view = mode === "in" ? "outstanding_receivables" : "outstanding_payables";
    const bills = partyId ? await select(view, `ledger_id=eq.${partyId}&order=bill_date&select=bill_id,outstanding_amount`) : [];
    let left = amount;
    const bill_allocations = [];
    for (const b of bills) {
      const applied = round2(Math.min(left, b.outstanding_amount));
      if (applied <= 0) break;
      bill_allocations.push({ bill_id: b.bill_id, amount: applied });
      left = round2(left - applied);
    }
    const moneyLine = { ledger_id: account, debit_amount: mode === "in" ? amount : 0, credit_amount: mode === "in" ? 0 : amount };
    const counter = { ledger_id: counterId, debit_amount: mode === "in" ? 0 : amount, credit_amount: mode === "in" ? amount : 0 };
    await post({
      voucher_type_code: mode === "in" ? "RCPT" : "PMT",
      voucher_date: date,
      party_ledger_id: partyId,
      reference_no: ref,
      narration: note,
      total_amount: amount,
      ledger_entries: mode === "in" ? [moneyLine, counter] : [counter, moneyLine],
      bill_allocations: bill_allocations.length ? bill_allocations : undefined,
    });
  }
  const expense = (date, head, amount, account, note) =>
    money({ mode: "out", date, counterId: ledgers[head], amount, account, note });

  const pending = async (view, partyId) =>
    round2((await select(view, `ledger_id=eq.${partyId}&select=outstanding_amount`)).reduce((s, b) => s + b.outstanding_amount, 0));

  // ---------- day-by-day trading ----------

  const hardware = items.filter((i) => !i.sheet);
  const sheets = items.filter((i) => i.sheet);
  const byName = (n, mm) => items.find((i) => i.name === n && (mm === undefined || i.thickness_mm === mm));
  const take = (item, want) => Math.min(want, Math.floor(stock[item.id]));

  for (const d of days(START, END)) {
    const date = iso(d);
    const dow = d.getUTCDay(); // 0 = Sunday
    const dom = d.getUTCDate();

    // Restock on Mondays (until the last week, so some items end up low for the dashboard)
    if ((dow === 1 && date <= "2026-10-05") || date === START) {
      for (const [key, supplier] of Object.entries(supplierByKey)) {
        const toBuy = items
          .filter((i) => i.supplier === key && stock[i.id] < i.low_stock_qty * 1.5)
          .map((i) => ({ item: i, qty: Math.ceil(i.low_stock_qty * 3 - stock[i.id] + randInt(0, i.low_stock_qty)), rate: i.purchase_rate }));
        if (toBuy.length === 0) continue;
        const total = await trade({
          code: "PURC",
          date,
          party: supplier,
          lines: toBuy,
          ref: `${key.slice(0, 3).toUpperCase()}/${randInt(1000, 9999)}`,
          note: "Stock replenishment",
        });
        await expense(date, total > 50000 ? "Transport & Freight" : "Loading & Unloading", total > 50000 ? randInt(18, 30) * 100 : randInt(4, 8) * 100, CASH, `Freight - ${supplier.name}`);
      }
    }

    // Walk-in counter sales (fewer on Sundays)
    const walkIns = dow === 0 ? randInt(0, 2) : randInt(3, 7);
    for (let n = 0; n < walkIns; n++) {
      const lines = [];
      for (let k = 0; k < randInt(1, 3); k++) {
        const item = pick(hardware);
        if (lines.some((l) => l.item.id === item.id)) continue;
        const qty = take(item, item.standard_rate > 1000 ? 1 : randInt(1, item.standard_rate < 50 ? 25 : 6));
        if (qty > 0) lines.push({ item, qty, rate: item.standard_rate });
      }
      if (chance(0.25)) {
        const sheet = pick(sheets.filter((s) => s.standard_rate < 2500));
        const qty = take(sheet, randInt(1, 3));
        if (qty > 0) lines.push({ item: sheet, qty, rate: sheet.standard_rate });
      }
      if (lines.length === 0) continue;
      const upi = chance(0.4);
      await trade({ code: "SALE", date, party: { id: walkIn, state: HOME_STATE }, lines, settle: upi ? BANK : CASH, note: upi ? "Paid by UPI" : undefined });
    }

    // Early site orders from the slow payers — these end up overdue
    if (date === "2026-08-04" || date === "2026-08-13") {
      for (const cust of customers.filter((c) => SLOW_PAYERS.includes(c.name))) {
        const lines = [byName("Ecotec MR Plywood", 18), byName("Gold MR Plywood"), byName("Auto Close Hinge 0 Crank")]
          .map((item) => ({ item, qty: take(item, item.sheet ? randInt(4, 8) : 20), rate: round2(item.standard_rate * 0.95) }))
          .filter((l) => l.qty > 0);
        await trade({ code: "SALE", date, party: cust, lines, ref: vehicle(), note: "Site delivery" });
      }
    }

    // Contractor / carpenter orders
    if (dow !== 0) {
      for (let n = 0; n < (chance(0.6) ? randInt(1, 2) : 0); n++) {
        const cust = pick(customers);
        const bulk = customerKind[cust.name] === "contractor";
        const lines = [];
        for (let k = 0; k < randInt(1, 2); k++) {
          const sheet = pick(sheets);
          if (lines.some((l) => l.item.id === sheet.id)) continue;
          const qty = take(sheet, bulk ? randInt(3, 10) : randInt(1, 4));
          // Regular customers get a small trade discount off the counter price
          if (qty > 0) lines.push({ item: sheet, qty, rate: round2(sheet.standard_rate * (bulk ? 0.95 : 0.98)) });
        }
        for (let k = 0; k < randInt(1, 4); k++) {
          const item = pick(hardware);
          if (lines.some((l) => l.item.id === item.id)) continue;
          const qty = take(item, randInt(2, bulk ? 20 : 8));
          if (qty > 0) lines.push({ item, qty, rate: item.standard_rate });
        }
        if (lines.length === 0) continue;
        const paidNow = chance(bulk ? 0.15 : 0.35);
        await trade({
          code: "SALE",
          date,
          party: cust,
          lines,
          settle: paidNow ? (chance(0.5) ? BANK : CASH) : null,
          ref: bulk ? vehicle() : undefined,
          note: bulk ? "Delivered to site" : undefined,
        });
      }
    }

    // Customers settle bills once they fall due (most pay within a week or two of the due date)
    if (dow !== 0) {
      for (const cust of customers) {
        const bills = await select("outstanding_receivables", `ledger_id=eq.${cust.id}&select=outstanding_amount,due_date`);
        const overdue = round2(bills.filter((b) => b.due_date && b.due_date <= date).reduce((s, b) => s + b.outstanding_amount, 0));
        const all = round2(bills.reduce((s, b) => s + b.outstanding_amount, 0));
        const slow = SLOW_PAYERS.includes(cust.name);
        if (!(overdue > 0 && chance(slow ? 0.01 : 0.3)) && !(!slow && all > 0 && chance(0.03))) continue;
        const amount = chance(0.6) ? (overdue || all) : Math.max(500, Math.round(((overdue || all) * 0.5) / 500) * 500);
        const bank = chance(0.7);
        await money({
          mode: "in",
          date,
          counterId: cust.id,
          partyId: cust.id,
          amount: Math.min(amount, all),
          account: bank ? BANK : CASH,
          ref: bank ? pick([`UPI ${randInt(100000, 999999)}`, `CHQ ${randInt(100000, 999999)}`, `NEFT ${randInt(100000, 999999)}`]) : undefined,
        });
      }
    }

    // Paying suppliers every ~10 days, never spending money the shop doesn't have:
    // cash first while the drawer is full (local suppliers), otherwise from the bank
    if ([10, 20, 30].includes(dom)) {
      for (const supplier of Object.values(supplierByKey)) {
        const due = await pending("outstanding_payables", supplier.id);
        if (due < 1000) continue;
        const balances = await rpc("ledger_balances", { p_as_of: date });
        const spare = (id, keep) => Math.max(0, (balances.find((b) => b.ledger_id === id)?.signed_balance ?? 0) - keep);
        const wanted = chance(0.5) ? due : Math.round((due * 0.6) / 1000) * 1000;
        const cashRoom = supplier.state === HOME_STATE ? spare(CASH, 60000) : 0;
        const account = cashRoom >= Math.min(wanted, 20000) ? CASH : BANK;
        const amount = Math.floor(Math.min(wanted, account === CASH ? cashRoom : spare(BANK, 100000)) / 1000) * 1000;
        if (amount < 1000) continue;
        await money({
          mode: "out",
          date,
          counterId: supplier.id,
          partyId: supplier.id,
          amount,
          account,
          ref: account === CASH ? "Cash paid" : `NEFT ${randInt(100000, 999999)}`,
        });
      }
    }

    // Monthly and routine shop expenses
    if (dom === 1) await expense(date, "Shop Rent", 28000, BANK, `Shop rent - ${d.toLocaleString("en-IN", { month: "long", timeZone: "UTC" })}`);
    if (dom === 5) await expense(date, "Staff Salary", 52000, BANK, "Salary - Ramesh, Balu, Selvi, Karthik");
    if (dom === 8) await expense(date, "Telephone & Internet", 1178, BANK, "Airtel broadband + mobile");
    if (dom === 12) await expense(date, "Electricity Bill", randInt(38, 52) * 100, BANK, "TANGEDCO EB bill");
    if (dow === 6) await expense(date, "Tea & Refreshments", randInt(9, 15) * 100, CASH, "Weekly tea & snacks");
    if (dow === 3 && chance(0.5)) await expense(date, "Other Expenses", randInt(3, 12) * 100, CASH, pick(["Pooja items", "Stationery", "Bike petrol", "Cleaning"]));
  }

  // ---------- returns ----------

  const lam = byName("Suede Finish Laminate");
  const selvam = customers.find((c) => c.name === "Selvam Carpentry Works");
  const selvamBills = await select("outstanding_receivables", `ledger_id=eq.${selvam.id}&order=bill_date.desc&select=bill_id,outstanding_amount`);
  const selvamBill = selvamBills.find((b) => b.outstanding_amount > lam.standard_rate * 2.5);
  await trade({
    code: "CNOTE",
    date: "2026-10-06",
    party: selvam,
    lines: [{ item: lam, qty: 2, rate: round2(lam.standard_rate * 0.98) }],
    billId: selvamBill?.bill_id,
    settle: selvamBill ? null : CASH,
    note: "Wrong shade - returned unused",
  });
  const lock = byName("Mortise Lock with Handle");
  await trade({ code: "CNOTE", date: "2026-09-16", party: { id: walkIn, state: HOME_STATE }, lines: [{ item: lock, qty: 1, rate: lock.standard_rate }], settle: CASH, note: "Lock key mechanism faulty - refunded" });

  const ply = byName("Commercial Plywood");
  const balaji = supplierByKey.balaji;
  const balajiBill = (await select("outstanding_payables", `ledger_id=eq.${balaji.id}&order=bill_date.desc&select=bill_id,outstanding_amount`))
    .find((b) => b.outstanding_amount > ply.purchase_rate * 4);
  if (balajiBill) {
    await trade({ code: "DNOTE", date: "2026-10-07", party: balaji, lines: [{ item: ply, qty: 3, rate: ply.purchase_rate }], billId: balajiBill.bill_id, note: "Delaminated sheets returned" });
  } else {
    await trade({ code: "DNOTE", date: "2026-10-07", party: balaji, lines: [{ item: ply, qty: 3, rate: ply.purchase_rate }], settle: CASH, note: "Delaminated sheets returned - cash refund" });
  }

  // A little other income
  await money({ mode: "in", date: "2026-09-21", counterId: ledgers["Cutting Charges"], amount: 1850, account: CASH, note: "Panel cutting charges - Sept" });

  // ---------- summary ----------
  const bal = Object.fromEntries((await rpc("ledger_balances", { p_as_of: END })).map((b) => [b.name, b.signed_balance]));
  const recv = await select("outstanding_receivables", "select=outstanding_amount,days_overdue");
  const pay = await select("outstanding_payables", "select=outstanding_amount");
  const low = await select("stock_summary", "is_low_stock=eq.true&select=name");
  console.log("Entries posted:", counts);
  console.log("Cash in hand:", bal["Cash"], "| Bank:", bal["City Union Bank - Current A/c"]);
  console.log("Customers owe:", round2(recv.reduce((s, r) => s + r.outstanding_amount, 0)), `(${recv.filter((r) => r.days_overdue > 0).length} overdue bills)`);
  console.log("We owe suppliers:", round2(pay.reduce((s, r) => s + r.outstanding_amount, 0)));
  console.log("Low-stock items:", low.map((l) => l.name).join(", ") || "none");
  console.log("\nLogins:");
  for (const u of USERS) console.log(`  ${u.role.padEnd(12)} ${u.email.padEnd(22)} ${u.password}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
