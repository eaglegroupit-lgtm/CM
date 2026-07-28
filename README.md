# Kovai Marbles & Granites — Accounts & Inventory Platform

A Tally-equivalent accounting, GST invoicing, and inventory system built for **Kovai
Marbles & Granites** (Coimbatore). Next.js (App Router) + Supabase (Postgres, Auth,
RLS) + Vercel.

## What's included

- Full chart of accounts (Tally-standard groups) and ledgers
- Voucher types: Sales, Purchase, Payment, Receipt, Journal, Contra, Debit Note, Credit Note
- Inventory for slabs (marble/granite, lot/bundle + thickness), tiles (size/finish),
  quartz (brand/batch), and simple qty+unit items
- GST calculation (CGST+SGST vs IGST by place of supply) and a printable GST tax invoice PDF
- Bill-by-bill outstanding tracking (receivables & payables) with ageing
- Reports: Day Book, Ledger, Trial Balance, Profit & Loss, Balance Sheet, Stock Summary, Outstanding
- Role-based access: Owner (full), Accountant (full ledgers/vouchers/reports, no user
  management), Sales Staff (Sales vouchers + stock/customer info only)
- Dashboard with KPIs and charts

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
