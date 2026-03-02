# Super Admin vs Customer Rep — Tabular Difference

| Area | Super Admin (ADMIN) | Customer Rep (REP) |
|------|---------------------|---------------------|
| **Dashboard & overview** | Full access; sees **total revenue** and all metrics | Dashboard access; **total revenue hidden** (null in overview) |
| **Orders** | View, assign, mark paid, create orders | View, assign, mark paid |
| **Customers** | View, edit, merge, tags, notes, actions, export, anonymize, audit | View, edit, tags, notes, actions (same as admin for these) |
| **Staff / Barbers** | View list & details; **invite staff** (+ Add Staff); **suspend, activate, terminate** barbers; **edit barber** profile | View list & details only (no invite, no suspend/activate/terminate, no edit) |
| **Staff recruitment** | View **new/old recruitment**; **Review application** → Approve/Decline; **Add new recruitment**; **Delete recruitment**; **Staff recruitment history** | No access (barber-applications APIs are admin-only) |
| **Services / Products** | View, **create**, **update**, **delete** products | View only (no create/edit/delete) |
| **Financials** | Full financials: revenue, **barber earnings**, **company commission**, **barber payouts**, refunds, trends, exports | **Limited**: revenue and orders data; **no barber earnings, commission, or payouts** |
| **Reports & export** | **Send weekly report**; export PDF/JSON/CSV; schedule exports | Can view reports; **no “Send weekly report”** if gated by isAdmin in UI; export may be disabled for view-only |
| **Reviews** | View, assign, escalate, resolve, respond; **hide, show, delete** reviews | View, assign, escalate, resolve, respond; **cannot** hide/show/delete |
| **Team** | **List team** (ADMIN/REP users); **create** new REP or Admin users | No access (team API is admin-only) |
| **Settings** | **Data retention** (update policy); integrations; other settings | View settings; **data retention update** is admin-only |
| **Analytics** | Traffic, inventory, operations, marketing, reviews analytics | Same (view) |
| **Audit / support** | View audit log; support tickets | Same (view) |
| **API (examples)** | `verifyAdmin` routes: barber-applications (GET/POST manual/DELETE/history), barbers (invite, suspend, activate, terminate, PATCH), products (POST/PUT/DELETE), team (GET/POST), reviews (hide/show/delete), data-retention (PATCH) | Uses `verifyAdminOrRep` only; all `verifyAdmin` routes return 401 |

---

## Summary

- **Super Admin** has full access: revenue, barber/staff management, products, team, recruitment, reviews (including hide/delete), and settings.
- **Customer Rep** can work with orders, customers, and reviews (except hide/delete), and see limited financials; they **cannot** manage staff/recruitment, products, team, or sensitive financial/earnings data.

---

## Viewer role (reference)

| Area | Viewer (VIEWER) |
|------|------------------|
| **Access** | Read-only: **GET/HEAD only**; all write (POST/PUT/PATCH/DELETE) blocked at API level when using `verifyAdminOrRep`. |
| **UI** | Export and “Send weekly report” disabled; no write actions. |
