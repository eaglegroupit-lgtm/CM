# Kadai Billing App — Full Guide (Gen Z Tanglish edition)

Yo! Idhu namma hardware & plywood kadai-oda billing app guide. Tally maadhiri dhaan, aana **Debit / Credit tension zero**. "Yaaru, evvalavu, cash-aa UPI-aa" — avlo dhaan scene. Sema easy, no cap.

**App link:** https://kovai-erp.vercel.app

---

## 1. Login — first step, chill

1. Chrome open pannu → **https://kovai-erp.vercel.app** po.
2. **Email** & **Password** type pannu.
3. **Sign in** adi. Done, ulla vandhaachu.
4. Password marandhutta? Panic aagadha bro — **Owner** kitta sollu, avanga pudhu password set pannuvaanga.

> **Careful da:** Demo passwords (`Owner@123` type) udane maathidu. Website public-la irukku, lowkey risky.

---

## 2. Dashboard — namma control room

Login pannina udane **Dashboard** varum. Ellaa vibe-um oru screen-la:

| Box | Enna artham |
|---|---|
| **New Sale** (periya button) | Bill podanuma? Direct-aa idha adi |
| **Purchase / Money Received / Money Paid** | Matha daily entries-kku shortcut |
| **Today's Sales** | Indraiku evvalavu vithom |
| **To Collect (customers owe)** | Customers namakku tharavendiya total |
| **To Pay (suppliers)** | Naama suppliers-kku kudukka vendiya total |
| **Stock Value** | Shelf-la irukura stock value (purchase rate-la) |
| **Low Stock — Reorder Soon** | Kaali aaga pora items — order pannu |
| **Money to Collect — How Old** | Evvalavu naala panam varala-nu chart |

Left side menu-la ellaa page-um irukku. Menu maraikka **☰** button.

---

## 3. New Sale (Bill) — main character moment

Menu: **Daily Entries → New Sale (Bill)**

1. **Customer**
   - Counter-la vandhu vaangi pora random aal-na → **Walk-in Customer** already select aagi irukkum. Touch pannadha.
   - Regular contractor / carpenter-na → peyar type pannu (eg: `Murugan`), list-la select pannu.
   - Pudhu aal-aa? Pakkathula **New Customer** button → add pannu.
2. **Payment** — panam eppadi vandhuchu?
   - **Cash** → kaila kaasu
   - **City Union Bank (UPI / Card / Bank)** → GPay, PhonePe, card, NEFT
   - **Credit (pay later)** → "apram tharen bro" case. Customer account-la ezhudhum.
   > Walk-in Customer-kku credit **kidaiyaadhu**. Credit-na proper peyar podanum.
3. **Date** — default-aa today. Venum-na maathiko.
4. **Items add pannu**
   - **Item** box-la type pannu — peyar, brand, size edhuvum work aagum (`18mm`, `Greenply`, `hinge`).
   - Ovvoru item pakkathula **stock evvalavu irukku**-nu kaatum. Vera level.
   - Select pannina **Qty = 1**, **Rate** auto-fill aagum.
   - Qty / rate change pannalaam (contractor-kku discount scene).
   - Adutha item-kku pudhu row **thaana** varum. Venaam-na 🗑 adi.
5. **Extra options** (thevai-na mattum)
   - **Reference / Vehicle no.** — delivery vandi number (`TN 37 AB 1234`)
   - **Note** — edhavadhu kurippu
   - **Rates include GST** — rate-la already GST irundhaa ON pannu. App thaniya split pannidum.
   - **Other-state party (IGST)** — Kerala, Karnataka party-na idhu thaana ON aagum.
6. **Total check pannu** — Taxable, CGST, SGST, Round off, periya **Total**.
7. **Save**
   - **Save & Print** → save + GST invoice PDF pudhu tab-la open. Print adi.
   - **Save Sale** → print illama save mattum.

> **Pro tip:** Stock thaana kurayum. Nee manual-aa update panna vendam. Life easy.

**Pazhaya bill paakka / reprint:** same page-la **Previous Entries** tab → bill number click → **Print Bill**.

---

## 4. Purchase — stock vandhaachu

Menu: **Daily Entries → Purchase**

1. **Supplier** select pannu (pudhusa-na **New Supplier**).
2. **Paid** — default **Credit (pay later)**. Udane panam kuduthaa cash/bank select pannu.
3. Items add pannu — **purchase price** auto-fill. Supplier bill rate-a podu.
4. **Supplier's bill no.** — supplier invoice number podu (pinnadi thedurathukku useful).
5. **Save Purchase**.

> Stock thaana **koodum**. Supplier-kku kudukka vendiyadhu "To Pay"-la serum.

---

## 5. Money Received — customer settle pannitaanga

Menu: **Daily Entries → Money Received**

1. **Received from** — customer select pannu.
2. Keezha **Pending bills** list varum — evvalavu baaki-nu theriyum.
   - Full-aa kuduthaanga-na → **Receive full amount** adi.
3. **Amount (₹)** podu.
4. **Received in** — **Cash** or **Bank** (UPI / cheque / NEFT).
5. **Cheque / UPI ref.** — optional.
6. **Save Money Received**.

> App thaana **pazhaya bill-la irundhu** adjust pannum (oldest first). Adhigama kuduthaa adhu **advance**-aa irukkum. Smart-u.

---

## 6. Money Paid / Expenses — panam veliya pochu

Menu: **Daily Entries → Money Paid / Expenses**

**Supplier-kku pay pannanum-na**
1. **Pay a Supplier** tab.
2. **Paid to** — supplier select. Pending bills theriyum.
3. **Amount**, **Paid from** (Cash / Bank), reference podu.
4. **Save Payment**.

**Kadai selavu-na**
1. **Shop Expense** tab.
2. **Expense for** — Shop Rent, Staff Salary, Electricity Bill, Transport & Freight, Loading & Unloading, Tea & Refreshments, Telephone & Internet, Other Expenses.
3. Amount, Cash/Bank → **Save Payment**.

> Pudhu selavu type venum-a (Diesel maadhiri)? **Cash, Bank & Expenses** page-la add pannu.

---

## 7. Returns — "bro idhu venaam"

**Sales Return** (customer porul thirumba kudutha) — Menu: **Daily Entries → Sales Return**
1. Customer select pannu.
2. **Refund** —
   - **Cash / Bank** → panam thirumba kuduthom
   - **Adjust against a pending bill** → avanga baaki bill-la kazhichidu (bill select pannanum)
3. Return items & qty podu → **Save Sales Return**. Stock thirumba **koodum**.

**Purchase Return** (damage porul supplier-kku back) — Menu: **Daily Entries → Purchase Return**
1. Supplier select.
2. **Refund received** — cash/bank-la vaangunom-a, illa bill-la adjust-aa.
3. Items, qty → **Save Purchase Return**. Stock **kurayum**.

---

## 8. Items & Stock — pudhu item add

Menu: **Items & Parties → Items & Stock** → **New Item**

| Field | Example |
|---|---|
| **Item Name** | `BWP Marine Plywood`, `SS Butt Hinge` |
| **Category** | Plywood, Laminates, Hinges & Channels, Screws... |
| **Sold in (unit)** | Sheet, Pcs, Box, Kg, Set, Pair, Metre |
| **Brand / Size / Thickness (mm)** | `Greenply`, `8x4 ft`, `18` |
| **Selling Price / Purchase Price** | ₹3650 / ₹3150 |
| **GST** | Mostly 18% |
| **HSN Code** | Optional — Plywood `4412`, Hinges `8302`, Locks `8301` |
| **Stock in hand now** | Ippo kadai-la evvalavu irukku |
| **Warn when stock below** | Idha vida kammi aana "Low stock" alert |

**Add Item** adi. Done.

**Stock check:** mela **Search** box-la type panni Search. **Low stock only** click pannina, order panna vendiya items mattum.

---

## 9. Customers & Suppliers

Menu: **Items & Parties → Customers / Suppliers** → **New Customer / New Supplier**

- Peyar, Phone, Address, **State** (important — GST / IGST idha vechu dhaan decide aagum), GSTIN irundhaa.
- Customer-kku **Credit Limit** & **Credit Days** (eg: 30 naal-la panam) set pannalaam.
- List-la ovvoru customer-um evvalavu **Outstanding**-nu theriyum.

---

## 10. Cash, Bank & Expenses — panam enga irukku?

Menu: **Items & Parties → Cash, Bank & Expenses**

- **Cash & Bank** — kadai cash & bank balance **live**-aa.
- **Expense Heads** — ovvoru selavu-la evvalavu pochu.
- **New Account** → Bank account, Cash box, Expense head (Diesel, Packing...), Other income (Cutting Charges), Owner's capital, Loan taken.

---

## 11. Reports — kanakku vibe check

| Report | Enna kaatum |
|---|---|
| **All Entries (Day Book)** | Date range kudu, ellaa entries-um varum |
| **Party Statement** | Oru customer / supplier-oda full kanakku |
| **Stock Report** | Ellaa item stock & value, search + low stock filter |
| **Pending Payments** | **Customers owe you** & **You owe suppliers** — evvalavu naal late-nu |
| **Profit & Loss** | Sales, purchase, selavu — laabam-aa nashtam-aa |
| **Balance Sheet** | Accountant-kku — assets, liabilities, capital |

> **Heads up:** Profit & Loss-la innum **closing stock** (shelf stock value) serkala. Niraya stock vaangina maasam nashtam maadhiri kaatum — panic aagadha. Stock Report value-vum serthu paaru.

---

## 12. Settings — Owner only zone

**Shop Details** (Menu: **Settings → Shop Details**)
- Kadai peyar, address, phone, **GSTIN**, PAN, bank details, invoice terms.
- Idhu dhaan **bill-la print** aagum. First idha correct-aa fill pannu.

**Users & Staff** (Menu: **Settings → Users & Staff**)
1. **New User** adi.
2. **Full Name**, **Email**, **Temporary Password**, **Role** podu.
3. Staff-kku login details kudu.

---

## 13. Yaaru enna pannalaam

| Velai | Owner | Accountant | Counter Staff |
|---|:-:|:-:|:-:|
| New Sale (Bill) | ✅ | ✅ | ✅ |
| Purchase, Returns, Money In/Out | ✅ | ✅ | ❌ |
| Items, Suppliers, Cash/Bank add | ✅ | ✅ | ❌ |
| Customers paakka | ✅ | ✅ | ✅ (add mudiyaadhu) |
| Day Book, Stock Report | ✅ | ✅ | ✅ |
| Profit & Loss, Balance Sheet, Pending, Party Statement | ✅ | ✅ | ❌ |
| Shop Details, Users | ✅ | ❌ | ❌ |

---

## 14. Oops, thappu aagiducha?

Ippo app-la entry **edit / delete button illa** (kanakku safe-aa irukkanum). So:

| Thappu | Fix |
|---|---|
| Sale-la extra qty pottutom | **Sales Return** podu — extra qty-kku |
| Purchase-la extra pottutom | **Purchase Return** podu |
| Money Received wrong amount | Owner / Accountant kitta sollu — admin database-la cancel pannuvaanga |
| Wrong customer-kku bill | Sales Return (adhe customer) + correct customer-kku pudhu Sale |

> Save adikkum munnaadi **Total & customer peyar** oru vaati check pannu. Saves drama.

---

## 15. Daily routine — oru naal flow

**Morning** ☀️
1. Login → Dashboard.
2. **Low Stock** paathu supplier-kku order.
3. **Pending Payments** paathu, late customers-kku oru call.

**Naal muzhukka**
1. Ovvoru sale-um → **New Sale (Bill)**.
2. Stock vandha → **Purchase**.
3. Customer pay pannaa → **Money Received**.
4. Supplier / selavu → **Money Paid / Expenses**.

**Kadai close pannum podhu** 🌙
1. **Cash, Bank & Expenses** → app cash balance = kaila irukura cash? Match aaganum.
2. **All Entries (Day Book)** — indraiku entries quick scroll.

**Month end**
1. Rent, salary, EB bill → **Shop Expense**.
2. **Profit & Loss** & **Pending Payments** check.

---

## 16. Admin / Dev corner (staff skip pannalaam)

**Stack:** Next.js on **Vercel** (`eagl/kovai-erp`) + **Supabase** database (`supabase-erin-bridge`). Code: GitHub `eaglegroupit-lgtm/CM`.

**Local run**
```bash
npm install
npx supabase start        # Docker Desktop on-la irukkanum
npm run dev               # http://localhost:3000
```

**Demo data (local only, live-la NEVER)**
```bash
npx supabase db reset
npm run seed:demo
```

**Change pannitu live-la poda**
1. `npx tsc --noEmit` & `npx eslint src` — zero errors.
2. `npx next build` — pass aaganum.
3. Pudhu `supabase/migrations/*.sql` irundhaa → **first** live database-la apply, **apram** code deploy.
4. `git add -A && git commit -m "msg" && git push`
5. `npx vercel --prod` (Vercel-la GitHub connect pannita push-e podhum, auto deploy).

**Remember**
- Big change munnaadi live database **backup** edu (`pg_dump`).
- Free Supabase use pannaama vitta **pause** aagidum — munnaadi site down aanadhu idhanaala dhaan.
- Live-la ippo irukura customers, items, entries ellam **demo data**. Real use start panna munnaadi clear panni real shop details podu.
