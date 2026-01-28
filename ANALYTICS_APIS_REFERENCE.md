# Analytics Dashboard – APIs Besides Google Analytics

This document lists **external APIs you’ll need** (or can use) to build the analytics/financials dashboard, **excluding** Google Analytics.

---

## 1. **Payment gateway APIs** (required for financial analytics)

You use **Paystack** (and optionally **Stripe**). Use their APIs for:

- Transaction lists, success/failure rates, refunds
- Fees, net revenue
- Payment method breakdown (card, transfer, etc.)

| API | Purpose | What you get |
|-----|---------|--------------|
| **Paystack API** | Primary payments (Nigeria) | Transactions, verification, refunds, settlements, success/failure stats |
| **Stripe API** | If you use Stripe | Charges, refunds, payouts, balance, fees |

**Endpoints you’ll use:**  
Paystack: `GET /transaction`, `GET /transaction/verify`, etc.  
Stripe: `charges`, `balance_transactions`, `payouts`, etc.

**Auth:** API keys (Paystack secret key, Stripe secret key) – already in env.

---

## 2. **Uptime & downtime monitoring** (for Operations tab)

For **uptime %, downtime incidents, duration, and alerts**:

| Service | API | Typical use |
|---------|-----|-------------|
| **UptimeRobot** | [UptimeRobot API](https://uptimerobot.com/api/) | Monitors, uptime %, incidents, alert contacts |
| **Better Uptime** | [Better Uptime API](https://betterstack.com/docs/uptime-api/) | Monitors, incidents, status pages |
| **Pingdom** | [Pingdom API](https://www.pingdom.com/resources/api) | Checks, summary reports, uptime |
| **StatusCake** | [StatusCake API](https://www.statuscake.com/api/v1/) | Tests, uptime, response time |

**Pick one.** UptimeRobot and Better Uptime both have free tiers and straightforward APIs.

**Alternative:** Custom health checks (e.g. cron hitting your API) + your own DB. That gives you *internal* uptime only; it won’t measure outages when your whole stack is down. External monitors (above) do that.

---

## 3. **IP geolocation** (“where was it viewed from”)

For **visitors by country, region, city** when you do **your own** page-view/event tracking (middleware, `analytics_page_views`, etc.):

| Service | API | Notes |
|---------|-----|--------|
| **ip-api.com** | HTTP JSON | Free tier, no key for limited use; `country`, `region`, `city` |
| **ipapi.co** | HTTP JSON | Free tier; similar fields |
| **MaxMind GeoIP2** | DB or API | More accurate; licence required for commercial use |
| **IPStack** | HTTP JSON | Freemium |

**If you use Google Analytics for traffic:** GA already provides geography. You’d only need these for **custom** server-side or first-party analytics.

---

## 4. **Email marketing analytics** (open/click rates)

You use **Hostinger SMTP + Nodemailer**. That gives send/delivery only, not opens/clicks.

For **email open rate, click rate, bounces, unsubscribes**:

| Service | API | Typical use |
|---------|-----|-------------|
| **SendGrid** | [SendGrid API](https://docs.sendgrid.com/api-reference/) | Events webhooks (opened, clicked, bounced, etc.) |
| **Mailchimp** | [Mailchimp API](https://mailchimp.com/developer/marketing/api/) | Campaigns, reports, opens, clicks |
| **Postmark** | [Postmark API](https://postmarkapp.com/developer) | Message stream, opens, clicks |
| **Resend** | [Resend API](https://resend.com/docs/api-reference) | Emails + webhooks for engagement |

**Options:**  
- **A)** Keep Hostinger SMTP and add **SendGrid (or similar)** only for *marketing* emails; use webhooks + your DB for analytics.  
- **B)** Use an ESP that supports webhooks and store events in your analytics DB.

---

## 5. **SMS analytics** (if you use SMS campaigns)

For **SMS delivery, status, engagement**:

| Service | API | Notes |
|---------|-----|--------|
| **Twilio** | [Twilio API](https://www.twilio.com/docs/api) | Messages, status, webhooks |
| **Termii** | [Termii API](https://developers.termii.com/) | Nigeria-friendly |
| **Africa’s Talking** | [Africa's Talking API](https://africastalking.com/docs) | Africa-focused |

Use the same provider you use for sending SMS; their API gives you the data for the “SMS marketing” section.

---

## 6. **Facebook / Meta (ads & social)** (optional)

For **paid ads, campaign performance, and social referral data**:

| API | Purpose |
|-----|---------|
| **Facebook Marketing API** | Ad accounts, campaigns, ad sets, ads, reach, spend, conversions |
| **Meta Pixel** | Front-end pixel for events; data flows into Meta, not directly into your DB |
| **Instagram Graph API** | Basic insights if you manage IG business accounts |

Use these only if you run **Facebook/Instagram ads** or need **Meta campaign analytics** in your dashboard.

---

## 7. **Maps (geographic visualizations)** (optional)

For **maps** (e.g. “visitors by country/region” or “branches”):

| Service | API | Use case |
|---------|-----|----------|
| **Mapbox** | [Mapbox GL / Maps API](https://docs.mapbox.com/api/) | Custom maps, choropleth, markers |
| **Google Maps** | [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) | Similar; you may already use it |

**Alternative:** Use **charts only** (e.g. bar/pie by country) and skip a map API.

---

## 8. **Accounting software** (optional)

For **P&amp;L, tax-ready exports, cash flow**:

| Service | API |
|---------|-----|
| **QuickBooks Online** | [QuickBooks API](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities) |
| **Xero** | [Xero API](https://developer.xero.com/documentation/api/) |

Only needed if you want to **push** data from your dashboard into accounting tools.

---

## 9. **What you don’t necessarily need an extra API for**

- **Financial totals, revenue by period, AOV, refunds:** Your **PostgreSQL** (orders, payments) + **Paystack/Stripe** data.  
- **Orders, services, barbers, customers:** All from your **own DB**.  
- **Basic traffic (if you use GA):** **Google Analytics API** – you already count that.  
- **Weekly email report:** Your **existing email service** (e.g. Hostinger SMTP) is enough to *send* the report; no new API required.  
- **System health (CPU, memory, DB checks):** **Custom code** (e.g. `/api/health`) + your DB + optional **external uptime** API above.

---

## 10. **Summary – what to integrate**

| Priority | API | Used for |
|----------|-----|----------|
| **Essential** | **Paystack API** | Revenue, transactions, payment analytics, refunds |
| **Essential** | **Stripe API** (if used) | Same, for Stripe payments |
| **Recommended** | **Uptime monitor** (e.g. UptimeRobot) | Uptime %, downtime, alerts |
| **If custom traffic** | **IP geolocation** (e.g. ip-api.com / ipapi.co) | “Where was it viewed from” |
| **If marketing emails** | **SendGrid / Mailchimp / etc.** | Open rate, click rate, bounces |
| **If SMS campaigns** | **Twilio / Termii / etc.** | SMS delivery and engagement |
| **If Meta ads** | **Facebook Marketing API** | Ad performance, ROAS, etc. |
| **Optional** | **Mapbox / Google Maps** | Map visualizations |
| **Optional** | **QuickBooks / Xero** | Accounting sync |

---

## 11. **Practical order of integration**

1. **Paystack (and Stripe if used)** – financial analytics.  
2. **Uptime API** (e.g. UptimeRobot) – Operations tab.  
3. **Google Analytics API** – traffic, sources, devices (you asked apart from this, but it’s part of the full picture).  
4. **IP geolocation** – only if you add **custom** server-side tracking and want geography without GA.  
5. **Email / SMS / Meta / Maps / Accounting** – only if you use those channels and want them in the dashboard.

---

*Last updated: Jan 2026*
