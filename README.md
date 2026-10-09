# Hardware & Plywood Shop — Billing, Stock & Accounts

Tally-style accounting made simple for a hardware & plywood shop. Next.js (App Router) +
Supabase (Postgres, Auth, RLS) + Vercel. Proper double-entry accounts run underneath, but
the screens use plain words — nobody has to pick Debit or Credit.

## What's included

- **New Sale (Bill)** — searchable items, Walk-in Customer by default, Cash / Bank (UPI) /
  Credit in one step, rates with or without GST, rupee round-off, Save & Print (GST invoice PDF)
- **Purchase**, **Sales Return**, **Purchase Return** — stock updates automatically
- **Money Received** / **Money Paid / Expenses** — who, how much, cash or bank; pending bills
  are settled oldest-first automatically
- **Items & Stock** — plywood/board/laminate/hardware categories, brand, size, thickness,
  selling + purchase price, GST %, low-stock alerts
- **Cash, Bank & Expenses** — balances at a glance; add bank accounts or expense heads
- Reports: All Entries (Day Book), Party Statement, Stock Report, Pending Payments,
  Profit & Loss, Balance Sheet
- Logins: Owner (everything), Accountant (everything except users), Sales Staff (billing only)

Shop name, address, GSTIN and bank details are set in **Settings → Shop Details**.

## 1. Set up Supabase

You said you already have a Supabase project. In that project:

1. Open the SQL Editor (or use the Supabase CLI — see below).
2. Run every file in `supabase/migrations/` **in filename order** (they're timestamp
   prefixed, so alphabetical = correct order).
3. Run `supabase/seed.sql` once — it seeds the chart of accounts, this company's
   details, stock categories/units, and voucher types. Safe to re-run.
4. In **Authentication → Providers**, keep Email enabled. Create yourself as the
   first user either via the Supabase dashboard (Authentication → Users → Add user,
   with `user_metadata: { "full_name": "...", "role": "owner" }`) — the
   `handle_new_user()` trigger reads that metadata to set your role automatically.
   If you sign up without metadata, you'll default to `sales_staff`; update your row
   in `user_profiles` to `owner` directly in the table editor for the first account.

### Using the Supabase CLI instead (optional)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push      # applies supabase/migrations/*
npx supabase db execute --file supabase/seed.sql
```

### Regenerate types against your live project (recommended once deployed)

```bash
npx supabase gen types typescript --project-id <your-project-ref> > src/types/database.ts
```

## 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your project's values (Project
Settings → API in Supabase):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only — it's used exclusively by
Settings → Users to create Accountant/Sales Staff logins. Never expose it to the
browser and never commit `.env.local`.

## 3. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`, sign in with the owner account you created in step 1.

### Demo data (optional, local only)

To try the app with ~10 weeks of realistic entries for a Coimbatore shop (Tamil Nadu customers
and suppliers, plywood/hardware items, sales, purchases, collections, expenses and returns):

```bash
npx supabase db reset   # wipes the local database
npm run seed:demo       # prints the demo logins when done
```

Never run this against the live database.

## 4. Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket (or `vercel --prod` directly from this
   directory with the Vercel CLI).
2. In the Vercel project, add the same three environment variables from step 2
   (Project Settings → Environment Variables) for Production, Preview, and
   Development as needed.
3. Deploy. No special build configuration is required — it's a standard Next.js app.

## Notes & limitations (by design, for this first version)

- Cancelling a voucher marks it `cancelled` and excludes it from reports; it does
  **not** auto-generate reversing entries. Reverse manually with a Journal if needed.
- Year-end closing (carrying forward ledger balances into a new financial year) is a
  manual step for now: create the new row in `financial_years`, mark it active, and
  update each ledger's `opening_balance` from the prior year's closing Trial Balance.
- Stock item/ledger dropdowns use plain search-free selects — fine for the current
  scale of masters; worth swapping to the already-installed `combobox` component if
  the item list grows very large.
