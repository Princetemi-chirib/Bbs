# Weekly Report – Full Specification

The weekly report is a **broad report** containing every detail the dashboard tracks for the week. It is sent via **Send weekly report** (Analytics & Financial dashboard) or `POST /api/v1/admin/reports/weekly-email`.

---

## 1. Period & comparison

- **This week:** Sunday 00:00 → now (report period).
- **Last week:** Previous Sunday–Saturday (for week-over-week comparison).
- **Period label** in subject and header (e.g. `9 Feb 2026 – 15 Feb 2026`).

---

## 2. Financial & orders

- **Revenue (this week)** – sum of paid orders in the week.
- **Week-over-week revenue change** – % vs last week.
- **Orders:** total count, paid count, pending count, failed count, refunded count.
- **Orders by status** – CONFIRMED, PENDING, PROCESSING, COMPLETED, CANCELLED (counts).
- **Orders by job status** – PENDING_ACCEPTANCE, ACCEPTED, ON_THE_WAY, ARRIVED, COMPLETED, DECLINED (counts).
- **Orders by payment method** – Paystack, Cash, etc. (count + revenue per method).
- **New customers** – count created this week.
- **Top items by revenue** – product/service name and revenue (top 10).
- **Top barbers by revenue** – barber name, revenue, order count (top 10).
- **Revenue by location** – by city (if tracked).
- **Recent transactions** – last 15 orders (order number, customer, amount, status, date).
- **Refunds** – count, total amount, and list of refunded orders (if any).

---

## 3. Site traffic (first‑party)

- **Total page views** – count of `traffic_events` in the week.
- **Unique visitors** – distinct `session_id` in the week.
- **Page views over time** – daily breakdown (date → count).
- **Top pages by views** – URL and count (top 20).
- **Top referrers** – referrer and count (top 15).
- **By device** – device type and count.
- **By country** – country and count (top 20), if available.
- **By city** – city and count (top 20), if available.

---

## 4. Reviews & feedback

- **Total reviews** (in period) and **average rating**.
- **New reviews this week** – count.
- **Rating distribution** – 1–5 stars (count and %).
- **Response rate** – % of reviews with barber/admin response.
- **Reviews with response** – count.
- **Sentiment summary** – positive mentions, negative mentions, ratio.
- **Feedback themes** – e.g. Wait time, Pricing, Service quality (counts).
- **Reviews by barber** – barber name, count, avg rating (top 10).
- **Reviews by service** – service name, count, avg rating (top 10).
- **Recent reviews** – last 10 (rating, comment snippet, barber, service, date).

---

## 5. Staff & barbers

- **Total barbers** – all time.
- **Active barbers** – status = ACTIVE.
- **Staff recruitment (barber applications):**
  - Pending applications (count).
  - Approved this week (count).
  - Declined this week (count).
- **Recruitment history** – optional summary of actions this week (submitted, approved, rejected, deleted).

---

## 6. Operations (if data exists)

- **Support tickets** – open, resolved this week, total this week.
- **Resolution rate** – % resolved.
- **Active sessions** – current (optional).
- **Uptime / response time / error rate** – if `OperationalMetric` is populated.

---

## 7. Marketing (if data exists)

- **Communications sent** – count this week (email/SMS).
- **By type** – email, SMS, etc. (counts).
- **By status** – delivered, failed, etc. (counts).
- **Campaigns** – active or started this week (name, dates).

---

## 8. Inventory (current snapshot)

- **Total products** – active count.
- **Low stock alerts** – count and list (product, current stock, reorder point).
- **Out of stock** – count and list (product name).
- **Inventory value** – total and optionally by product (top 10).
- **Top turnover (last 30 days)** – product, sold, turnover rate (top 10); note “last 30 days” in report.

---

## 9. Footer

- Short note that the report is from the Analytics & Financial Dashboard.
- Link or note on how to open the full dashboard.

---

## Implementation

- **Route:** `app/api/v1/admin/reports/weekly-email/route.ts`.
- All metrics are **scoped to the current week** (Sunday–now) unless stated (e.g. inventory snapshot, turnover last 30 days).
- Optional sections (operations, marketing, inventory) are included only when the corresponding tables exist and return data; failures are caught and sections omitted.
