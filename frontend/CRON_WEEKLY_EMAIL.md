# Weekly Email Cron (Vercel Hobby / Free)

The weekly analytics report is sent automatically via **Vercel Cron** on **Mondays at 9:00** (runs in the 9:00 hour on the free Hobby plan).

## Setup on Vercel (free)

1. **Environment variables** (Project → Settings → Environment Variables):

   - `CRON_SECRET` — e.g. `openssl rand -hex 32`. Vercel sends `Authorization: Bearer <CRON_SECRET>` when invoking the cron.
   - `WEEKLY_REPORT_EMAILS` — comma-separated admin emails, e.g. `admin@example.com,rep@example.com`

2. **Deploy** — the `vercel.json` crons entry is enough; no extra config.

3. **Cron route:** `GET /api/v1/admin/reports/weekly-email-cron`  
   - On Hobby: runs in the 9:00 hour on Mondays (hourly precision).  
   - Report content: revenue, orders, new customers, top items, top barbers, WoW %.

## Manual send

Use **Send weekly report** on the Financials dashboard; it sends to the logged-in admin/rep email via `POST /api/v1/admin/reports/weekly-email`.
