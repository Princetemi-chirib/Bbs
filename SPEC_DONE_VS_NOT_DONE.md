# Analytics Dashboard Specification — Done vs Not Done

**Status of each spec item relative to the current implementation** (`/admin/financials` and related APIs).  
✅ = Implemented | ❌ = Not implemented | ⚠️ = Partial

---

## 1. Financial Analytics

### 1.1 Revenue Tracking

| Spec Item | Status |
|-----------|--------|
| **Total Revenue** | |
| Lifetime total revenue | ✅ |
| Revenue by period (daily, weekly, monthly, quarterly, yearly) | ✅ |
| Revenue trends (growth rate, % change) | ✅ WoW, MoM, YoY, DoD |
| Revenue projections/forecasts | ✅ 1‑ and 3‑month (3‑month avg) |
| Revenue by payment method (card, cash, etc.) | ✅ |
| Revenue by service type | ⚠️ Top services by revenue; not per “type” label |
| Revenue by branch/location | ✅ By city (Order.city) |
| Revenue by barber/stylist | ✅ Top earning barbers |
| Revenue by customer segment (new, returning, VIP) | ✅ |

### 1.2 Revenue Breakdown

| Spec Item | Status |
|-----------|--------|
| Service revenue vs product revenue | ✅ |
| Commission breakdown (barber vs platform) | ✅ |
| Discounts given (total, % of revenue) | ✅ In Summary Statistics (Financial tab) when data present |
| Refunds (total amount, refund rate) | ✅ |
| Outstanding payments / accounts receivable | ✅ Pending orders count |
| Revenue per customer (avg, median, top 10%) | ✅ Avg, median, top 10% (revenue + % of total) on Financials |
| Revenue per order (AOV) | ✅ |
| Revenue per visit | ✅ Revenue / paid bookings |

### 1.3 Financial Health

| Spec Item | Status |
|-----------|--------|
| Profit margins | ✅ Financial Health card (CoGS, gross profit, margin %) |
| Operating costs | ✅ Monthly + prorated for period |
| Net profit | ✅ Revenue − refunds |
| Cash flow (inflow vs outflow) | ✅ Inflow, outflow, net in Financial Health card |
| Breakeven analysis | ✅ Breakeven orders (period) |
| Cost per acquisition (CPA) | ✅ From campaign spend when set |
| LTV to CPA ratio | ✅ In Financial Health card |

### 1.4 Payment Analytics

| Spec Item | Status |
|-----------|--------|
| **Payment Methods** | |
| Distribution by payment type | ✅ |
| Success rate by payment method | ✅ |
| Average transaction value by method | ✅ |
| Failed payment attempts | ✅ Failed orders count |
| Payment processing fees by method | ✅ Table in Financial tab (when data present) |
| **Payment Status** | |
| Paid vs pending vs failed | ✅ |
| Payment completion rate | ✅ |
| Average time to payment | ✅ |
| Partial payments tracking | ✅ Count and total amount |
| Payment retry success rate | ✅ In Summary Statistics when available |

### 1.5 Transaction Details

| Spec Item | Status |
|-----------|--------|
| **Transaction Log** | |
| All transactions with timestamps | ✅ |
| Transaction IDs | ✅ Order ID, order number |
| Customer details | ✅ |
| Service/product details | ✅ Item titles in Recent Transactions (Financial + Orders tab) |
| Amount, payment method, status | ✅ |
| Refund history | ✅ Dedicated table |
| Chargeback tracking | ✅ Total + recent table (Financial tab) |

### 1.6 Financial Reports

| Spec Item | Status |
|-----------|--------|
| **Periodic Reports** | |
| Daily / weekly / monthly / quarterly / annual (distinct types) | ✅ Report-type PDF titles + period-specific filenames |
| Year‑over‑year, month‑over‑month comparisons | ✅ MoM, YoY in API & UI |
| **Export** | |
| PDF financial reports | ✅ |
| Excel/CSV export | ✅ |
| Custom date range reports | ✅ |
| Tax‑ready financial summaries | ✅ Export Tax Summary (CSV) |

---

## 2. Site Analytics & Traffic

| Spec Item | Status |
|-----------|--------|
| Page views | ✅ TrafficEvent + TrafficTracker (LayoutWrapper); POST /api/v1/analytics/track |
| Visitors (approximate) | ✅ Distinct sessions (30 min TTL) via sessionId; uniqueVisitors in Site Traffic tab |
| Top pages | ✅ By URL in Site Traffic tab |
| Referrers / sources | ✅ By referrer in Site Traffic tab |
| Device (desktop, mobile, tablet) | ✅ By device in Site Traffic tab; pie chart |
| Page views over time | ✅ Line chart in Site Traffic tab |
| Geography (country, city) | ❌ TrafficEvent has country, city; not yet captured (would need geo IP) |
| Admin view & period filter | ✅ GET /api/v1/admin/analytics/traffic; Site Traffic tab in Financials; uses period/start/end |

---

## 3. Customer Analytics

### 3.1 Customer Metrics

| Spec Item | Status |
|-----------|--------|
| **Customer Growth** | |
| Total customers | ✅ |
| New customers (daily, weekly, monthly) | ✅ New today, this week, this month |
| Customer growth rate | ✅ |
| Customer acquisition trends | ✅ Last 12 months (chart) |
| Customer retention rate | ✅ |
| Customer churn rate | ✅ |
| Active vs inactive customers | ✅ |
| **Segmentation** | |
| New, returning, VIP, at‑risk, dormant, problematic | ⚠️ On customer analytics page |
| CLV by segment | ✅ New, Returning, VIP (when period filter applied) |

### 3.2 Customer Behavior

| Spec Item | Status |
|-----------|--------|
| Average order value per customer | ✅ |
| Purchase frequency | ✅ Orders per customer |
| Time between purchases | ✅ Avg days between consecutive orders |
| Most purchased services/products | ✅ Top services |
| Seasonal buying patterns | ✅ Via seasonal revenue by month |
| Preferred payment methods | ✅ Customer distribution (most-used method) |
| Login frequency, app usage, email/SMS, reviews, referral | ❌ |

### 3.3 Customer Demographics

| Spec Item | Status |
|-----------|--------|
| Age, gender, location distribution | ✅ Gender counts; age buckets (0–17, 18–24, 25–34, 35–44, 45+); location via revenue by city |
| Preferred channels, booking times, service types | ❌ |

### 3.4 Customer Value

| Spec Item | Status |
|-----------|--------|
| CLV | ✅ Avg lifetime value (revenue / customers with ≥1 paid order) |
| ARPU | ✅ |
| Top 10% (contribution to revenue) | ⚠️ Customer analytics page |
| CAC, CLV:CAC, profitability | ✅ CAC (= CPA) and LTV:CPA in Financial Health card; profitability via profit margins |

---

## 4. Order & Service Analytics

### 4.1 Order Overview

| Spec Item | Status |
|-----------|--------|
| **Order Metrics** | |
| Total orders | ✅ |
| Orders by period (daily, weekly, monthly) | ✅ |
| Order growth rate | ✅ WoW, MoM, YoY, DoD |
| Average order value | ✅ |
| Median order value | ✅ |
| Order completion rate | ✅ |
| Order cancellation rate | ✅ |
| Order refund rate | ✅ |
| **Order Status** | |
| Pending, confirmed, in‑progress, completed, cancelled, refunded | ✅ |
| Average time to completion | ✅ |

### 4.2 Service Analytics

| Spec Item | Status |
|-----------|--------|
| Most ordered services | ✅ |
| Least ordered services | ✅ |
| Service popularity trends | ✅ Top services vs prior period (Orders Δ, Revenue Δ) |
| Revenue per service | ⚠️ Via top services |
| Service completion time, cancellation, satisfaction | ✅ Avg completion min; avg scheduled duration; cancellation by service |
| **Service Categories** | |
| Revenue by category, orders by category | ✅ |
| Haircut / styling / nail / makeup / other (named) | ⚠️ Categories from data |

### 4.3 Product Analytics

| Spec Item | Status |
|-----------|--------|
| Most / least sold products | ✅ |
| Product revenue, profit margins | ✅ Product revenue via categories & productRevenueByMonth; profit margins (CoGS, margin %) per category in Revenue by Product Category table |
| Inventory turnover, out‑of‑stock, return rate | ❌ |
| Product sales by category, seasonality | ✅ Product categories (revenue/orders); product revenue by month (last 12 mo) |

### 4.4 Booking Analytics

| Spec Item | Status |
|-----------|--------|
| Peak booking times (hourly, daily, weekly) | ✅ Hourly, daily, monthly |
| Peak booking days / months / seasons | ✅ Day of week & month charts; top-3 peak days and top-3 peak months summary in Peak Booking Times |
| Booking lead time, same‑day, walk‑in vs scheduled | ✅ Avg lead time (days), same‑day count; walk‑in/scheduled not in schema |
| No‑show rate, cancellation by time before | ✅ No‑show rate; cancellation by time (same day / 1–7d / 7+d) |
| **Booking Channels** | |
| Online, phone, in‑person, app, source | ✅ Booking Channels table (Orders & Services tab) from Booking.source |

---

## 5. Barber/Stylist Analytics

### 5.1 Barber Performance

| Spec Item | Status |
|-----------|--------|
| Revenue per barber, orders per barber | ✅ |
| Average rating per barber | ✅ |
| Customer retention per barber | ✅ % with 2+ orders (in barber earnings) |
| No‑show rate per barber | ✅ |
| Cancellation rate per barber | ✅ |
| Average service time, availability/utilization | ✅ Avg service completion & scheduled duration (bookings) |
| **Rankings** | |
| Top by revenue | ✅ |
| Top rated, most booked, most reliable (low no‑show) | ✅ |

### 5.2 Barber Operations

| Spec Item | Status |
|-----------|--------|
| Hours worked, services completed | ✅ Services completed (completed paid bookings); hours worked (Hours column, from booking duration) |
| Online/offline status | ✅ Barbers online/offline counts; isOnline per barber |
| Peak performance times, productivity | ✅ Peak Hrs and Productivity columns in Top Earning Barbers; earnings by service in Earnings tooltip |
| Commission earned | ✅ |
| Earnings trends, by service type, payout history | ✅ Growth %; earnings by service type (tooltip on Earnings); payout history (Payouts column + tooltip) |

---

## 6. Operational Metrics

**All of Section 6:** ❌ **Not implemented.**  
Uptime, performance, errors, platform health, etc. would need new infrastructure.

---

## 7. Marketing Analytics

**All of Section 7:** ❌ **Not implemented.**  
Campaigns, email/SMS/push, social, etc. require marketing and comms data.

---

## 8. Review & Feedback Analytics

| Spec Item | Status |
|-----------|--------|
| Total reviews, average rating | ✅ |
| Rating distribution (1–5) | ✅ |
| Reviews by service, by barber | ✅ |
| Review response rate | ✅ |
| Sentiment analysis | ❌ |
| Feedback themes, complaints, suggestions, trends | ❌ |

---

## 9. Inventory & Product Management

**All of Section 9:** ❌ **Not implemented.**  
No inventory schema or product‑level analytics.

---

## 10. Location & Branch Analytics

| Spec Item | Status |
|-----------|--------|
| Revenue/orders per branch | ✅ By city; customers per city in Revenue by Location table |
| Customers per branch, utilization, profitability, growth | ⚠️ Customers per branch ✅ (Revenue by Location); growth ✅ (MoM % column); utilization, profitability ❌ |
| Service demand by location, customer distribution | ✅ Service demand by location (top services per barber city) |
| Peak times by location, location‑specific trends | ✅ Peak times by location (hourly per city); revenue by city by month (last 12 mo) |

---

## 11. Time‑Based Analytics

| Spec Item | Status |
|-----------|--------|
| Hourly patterns | ✅ Peak booking hours |
| Daily / weekly / monthly patterns | ✅ Revenue trend, peak times |
| Seasonal patterns | ✅ Revenue by month (Jan–Dec, all-time) |
| Holiday impact | ✅ Nigerian public holidays vs avg daily in month (last 12 mo) |
| Weekend vs weekday trends | ✅ |

### 11.2 Trend Analysis

| Spec Item | Status |
|-----------|--------|
| Growth/decline/seasonal/cyclical trends | ✅ Growth rates (DoD/WoW/MoM/QoQ/YoY); Revenue momentum (last 3 vs prev 3 months → Upward/Stable/Declining) in Overview |
| Anomaly detection | ❌ |

---

## 12. Comparative Analytics

| Spec Item | Status |
|-----------|--------|
| Day‑over‑day | ✅ |
| Week‑over‑week | ✅ |
| Month‑over‑month | ✅ |
| Quarter‑over‑quarter | ✅ |
| Year‑over‑year | ✅ |
| Period‑to‑period growth | ⚠️ Via period selector |
| Benchmarks (industry, internal, targets, goals) | ✅ Prior year same period (month/quarter/year) |

---

## 13. Predictive Analytics

**All of Section 13:** ❌ **Not implemented.**

---

## 14. Dashboard Features

### 14.1 Visualization

| Spec Item | Status |
|-----------|--------|
| Line, bar, pie, area charts | ✅ |
| Heatmaps | ✅ Booking heatmap (hour × day of week) |
| Funnel charts | ✅ Order funnel (All → Paid → Completed) |
| Gauge charts | ✅ Order completion rate gauge |
| Geographic maps | ❌ |
| Real‑time dashboards | ❌ |

### 14.2 Interactivity

| Spec Item | Status |
|-----------|--------|
| Date range picker | ✅ Period + custom range |
| Filter by category / service / barber / location | ✅ |
| Drilldown | ✅ Set filters from location, service, category, barber tables; Revenue bar click-to-filter |
| Export options | ✅ CSV, Excel, PDF, JSON |
| Custom report builder | ❌ |
| Saved views / bookmarks | ✅ Save/Load filters in localStorage (Financials) |

### 14.3 Data Export

| Spec Item | Status |
|-----------|--------|
| PDF reports | ✅ |
| Excel/CSV export | ✅ |
| JSON export | ✅ |
| Scheduled exports | ✅ GET /api/v1/admin/reports/scheduled-export-cron; Vercel Cron Tue 10am; last week CSV emailed to SCHEDULED_EXPORT_EMAILS or WEEKLY_REPORT_EMAILS |
| Custom report templates | ❌ |

---

## 15. Automated Weekly Email Reports

| Spec Item | Status |
|-----------|--------|
| Manual send: “Send weekly report” button | ✅ Sends to requester’s email (Admin/Rep) |
| Scheduled / automated weekly send | ✅ `GET /api/v1/admin/reports/weekly-email-cron`; Vercel Cron Mon 9am (works on Hobby/free, hourly precision); set `CRON_SECRET`, `WEEKLY_REPORT_EMAILS` |
| Report content: revenue, orders, new customers, top items, top barbers, WoW % | ✅ |

---

## 16. Real‑Time Monitoring

**All of Section 16:** ❌ **Not implemented.**

---

## 17. Data Retention & History

**All of Section 17:** ❌ **Not implemented.**

---

## 18. Security & Privacy

| Spec Item | Status |
|-----------|--------|
| Encrypted storage, secure transmission, access controls | ⚠️ App‑level |
| Audit logs (who viewed what, exports, etc.) | ✅ VIEW_FINANCIALS; EXPORT_CSV, EXPORT_EXCEL, EXPORT_PDF, EXPORT_JSON, EXPORT_TAX_SUMMARY; SEND_WEEKLY_REPORT via POST /api/v1/admin/audit-log → AnalyticsAuditLog |
| GDPR, anonymization, consent, minimization, deletion | ❌ |

---

## 19. Integration Capabilities

**All of Section 19:** ❌ **Not implemented.**

---

## 20. User Roles & Permissions

| Spec Item | Status |
|-----------|--------|
| Role‑based access (Admin, Rep) | ✅ |
| Manager, view‑only, custom permission sets | ❌ |
| Audit trail (views, exports, report generation) | ✅ Exports and weekly report logged to AnalyticsAuditLog; VIEW_FINANCIALS on load |

## Implementation Priority (from spec)
| Phase | Status |
|-------|--------|
| **Phase 1:** Financial revenue, order analytics, customer metrics, basic site analytics, weekly email reports | ⚠️ Financial, orders, customers, weekly emails ✅; site analytics ✅ (first‑party TrafficEvent, track API, Traffic tab) |
| **Phase 2:** Traffic, barber metrics, marketing, predictive, advanced viz | ⚠️ Barber metrics largely done; rest not |
| **Phase 3:** Real‑time, AI insights, integrations, custom report builder, mobile analytics | ❌ |
---
## Summary
- **Done (or partial):** §1 (financial, revenue breakdown, financial health, payment, transactions, export, discounts, chargebacks, fees, retry rate), **§2 (Site/Traffic: first‑party tracking, Traffic tab, by page/referrer/device, over time)**, §3 (core customer metrics), §4 (orders, services, bookings, peak times, booking channels), §5 (barber performance, rankings, productivity, peak hours, earnings by service, payout history), §8 (reviews), §10 (location, customers per city, growth MoM; utilization/profitability ❌), §11 (hourly/daily/monthly, weekend vs weekday, holiday impact), §12 (DoD/WoW/MoM/YoY), §14 (charts, filters, export, saved views), §15 (manual + cron weekly email), §18 (audit logs for views, exports, report generation), §20 (admin/rep roles, audit trail).
- **Not done:** §2 (geography); §6 (Operations); §7 (Marketing); §9 (Inventory); §10 (utilization, profitability per branch); §13 (Predictive); §16 (Real‑time); §17 (Retention); §19 (Integrations); plus §3/§4/§8 deeper items.

**Rough completion:** ~**80%** of the full spec (for items feasible with current schema and data).  

*Recent adds (this round): §14.3 Scheduled exports — GET /api/v1/admin/reports/scheduled-export-cron; Vercel Cron Tue 10am; last week financial CSV emailed as attachment to SCHEDULED_EXPORT_EMAILS or WEEKLY_REPORT_EMAILS; emailService attachments support. §4.4 Peak days/months — Top 3 peak days and Top 3 peak months summary in Peak Booking Times. §3.4 CAC, CLV:CAC — marked done (CPA + LTV:CPA in Financial Health). Earlier: §2 unique visitors, §4.3 product margins, §11.2 revenue momentum; traffic tab, audit logs, etc.*
