# Order Flow: Customer → Admin → Barber → Rating

End-to-end flow from customer ordering through rating submission, with implementation notes and inconsistencies.

---

## 1. Flow Overview (intended)

```
Customer places order (checkout or admin-created)
    → Order created, payment ref stored
    → Customer gets confirmation email
    → Admin gets new-order email
Admin assigns barber (admin dashboard)
    → Barber gets “New Order Assigned” email
    → Customer gets “Barber Assigned” email
Barber accepts or declines
    → If accept: Customer gets “Barber Accepted” email
    → If decline: Admin should get “Order declined” email (see gaps)
Barber updates status: On the way → Arrived → Completed
    → Customer gets email at each step; Completed email includes review link
Customer submits rating
    → Review created, barber stats updated
```

---

## 2. Step-by-step implementation

### 2.1 Order creation

| Path | Where | API | Auth | Notes |
|------|--------|-----|------|--------|
| **A. Checkout (customer)** | `frontend/app/checkout/page.tsx` | `POST /api/v1/orders` via `orderApi.create()` | **REP only** | **Inconsistency:** Checkout runs after Paystack success and calls the same endpoint. `POST /api/v1/orders` uses `verifyRep(request)` → only REP can create. Guest or customer users get **403** when saving the order after payment. |
| **B. Admin/Rep create** | `frontend/app/admin/orders/page.tsx` | Same `POST /api/v1/orders` | **REP only** | Works when the logged-in user is **REP**. If logged in as **ADMIN** only, creation fails with 403 (verifyRep allows only role REP). |

**Order creation logic** (`frontend/app/api/v1/orders/route.ts`):

- Validates required fields, generates `orderNumber`, finds or creates User/Customer by email.
- Creates Order with items, `paymentStatus: PAID` if `paymentReference` present, else PENDING.
- In background (non-blocking):
  - Sends **customer** `Order Confirmation` email.
  - Sends **admin** “New Order” email to `ADMIN_EMAIL` (or fallback).

**Recommendation:**

- Either allow **guest/customer** order creation for checkout (e.g. separate endpoint or allow CUSTOMER/optional auth for `POST /api/v1/orders` when `paymentReference` is present),  
- Or allow **ADMIN** in addition to REP for `POST /api/v1/orders` so admin dashboard order creation works for both roles.

---

### 2.2 Admin receives email

- **Implemented.** Admin notification is sent in the same background block as customer confirmation (`frontend/app/api/v1/orders/route.ts`).
- Uses `ADMIN_EMAIL` or `admin@bbslimited.online`.
- Email includes order number, customer, location, amount, items, link to dashboard.

---

### 2.3 Admin assigns barber

- **Where:** Admin Orders UI → assign barber to a paid order.
- **API:** `POST /api/v1/admin/orders/assign` with `{ orderId, barberId }`.
- **Auth:** Admin only (`verifyAdmin`).
- **Logic:** Order must exist, not already assigned to another barber, not completed. Barber must exist, be ACTIVE, **isOnline**, and within **availability** for current day/time. Order is set to `assignedBarberId`, `jobStatus: PENDING_ACCEPTANCE`.
- **Emails (non-blocking):**
  - **Barber:** “New Order Assigned” (customer name and address only — no customer phone/email).
  - **Customer:** “Barber Assigned” (barber name, location only — no barber phone/email).

**Consistent.**

---

### 2.4 Barber receives email and accepts/declines

- **Barber accept:** `POST /api/v1/barber/orders/[id]/accept` (Barber auth).
  - Order must be assigned to this barber and `jobStatus: PENDING_ACCEPTANCE`.
  - Sets `jobStatus: ACCEPTED`.
  - **Customer email:** “Barber Accepted Your Order” (barber name, location, ~10 min ETA).
- **Barber decline:** `POST /api/v1/barber/orders/[id]/decline` (Barber auth, body `{ reason }`).
  - Sets `jobStatus: DECLINED`, `declineReason`.
  - **Gap:** Code has `// TODO: Send email notification to admin about decline`. Admin is **not** notified when a barber declines.

**Recommendation:** Implement admin (and optionally customer) email on decline so the order can be reassigned.

---

### 2.5 Barber updates status (On the way → Arrived → Completed)

- **API:** `POST /api/v1/barber/orders/[id]/status` with `{ status }`.
- **Allowed transitions:** `ACCEPTED → ON_THE_WAY → ARRIVED → COMPLETED`.
- On **COMPLETED**, order `status` is set to COMPLETED and `paymentStatus` to COMPLETED if it was PENDING.
- **Customer emails (non-blocking):**
  - ON_THE_WAY: “Your Barber is On The Way”.
  - ARRIVED: “Your Barber Has Arrived”.
  - COMPLETED: “Service Completed!” with **review link**.

**Review link fix applied:** Link in “Service Completed” email was `/orders/{id}/review` but the app route is `/review/[orderId]`. The status route already uses `/review/${updatedOrder.id}` (correct).

---

### 2.6 Customer submits rating

- **Page:** `frontend/app/review/[orderId]/page.tsx` (URL: `/review/{orderId}`).
- **Load order:** `GET /api/v1/orders/[id]` — **requires CUSTOMER auth** and order must belong to that customer.
- **Submit:** `POST /api/v1/reviews` with `{ orderId, rating, comment }` — **requires CUSTOMER auth**; order must be completed, have assigned barber, and not already reviewed; `order.customerId` must match logged-in customer.
- **Backend:** Creates Review, updates barber `ratingAvg` and `totalReviews` in a transaction.

**Implications:**

- Review link in “Service Completed” email only works if the customer is **logged in** as the user that owns the order (same customerId).
- If the order was created by **Admin/Rep** on behalf of a customer, that customer has a User/Customer record and can log in (e.g. password reset) and then use the link.
- If **checkout** ever succeeds for a guest (after fixing order creation), that guest would have been auto-created as User/Customer; they would need to log in (e.g. set password via reset) before they can open the review page or submit a review.

**Recommendation:** For a smoother experience, consider a **token-based review link** (e.g. `/review?orderId=...&token=...`) that allows one-time submit without login, validated server-side using a signed token or short-lived magic link tied to the order.

---

## 3. Status and job status enums

- **Order `status`:** PENDING, CONFIRMED, PROCESSING, COMPLETED, CANCELLED.
- **Order `jobStatus`:** PENDING_ACCEPTANCE, ACCEPTED, ON_THE_WAY, ARRIVED, COMPLETED, DECLINED.
- **Payment:** PENDING, PAID, PARTIALLY_PAID, REFUNDED, FAILED.

Assignment sets `jobStatus: PENDING_ACCEPTANCE`. Barber accept → ACCEPTED; status updates → ON_THE_WAY → ARRIVED → COMPLETED. On COMPLETED, `status` is set to COMPLETED. Flow is consistent.

---

## 4. Inconsistencies and gaps summary

| # | Issue | Severity | Location / fix |
|---|--------|----------|-----------------|
| 1 | Checkout uses `POST /api/v1/orders` which is **REP-only**; customers/guests get 403 when saving order after Paystack. | High | Either allow customer/guest order creation (e.g. by auth or new endpoint) or document that checkout is “payment only” and orders are created only by Rep. |
| 2 | Admin creating order from dashboard gets 403 if user is **ADMIN** (only REP can create). | Medium | Consider allowing ADMIN in `POST /api/v1/orders` (e.g. use `verifyAdminOrRep` instead of `verifyRep`). |
| 3 | **Review link in “Service Completed” email** pointed to `/orders/{id}/review` instead of `/review/{id}`. | Medium | **Fixed:** `status` route now uses `/review/${updatedOrder.id}`. |
| 4 | **Barber decline:** no email to admin (TODO in code). | Medium | Implement admin (and optionally customer) notification when barber declines. |
| 5 | Review submission **requires customer to be logged in**; link in email may 401 if they are not. | Low / UX | Consider token/magic-link review submission for one-click from email. |

---

## 5. Quick reference: who gets which email

| Event | Customer | Admin | Barber |
|-------|----------|--------|--------|
| Order created | ✅ Order confirmation | ✅ New order | — |
| Barber assigned | ✅ Barber assigned | — | ✅ New order assigned |
| Barber accepted | ✅ Barber accepted | — | — |
| Barber declined | — | ❌ Not implemented | — |
| On the way | ✅ On the way | — | — |
| Arrived | ✅ Arrived | — | — |
| Completed | ✅ Service completed + review link | — | — |

---

## 6. Privacy: rider vs customer contact info

- **Rider (barber)** must never see customer **phone** or **email**. They see only **customer name** and **address** (city, location, address field). APIs and emails for barbers omit customer contact.
- **Customer** must never see barber **phone** or **email**. They see only **barber name** and **service address**. Order API and all customer-facing emails omit barber contact.

Implemented in: barber orders API response, customer order GET response, barber assignment/accept/status email templates, admin assign response, barber dashboard UI (no customer phone/email displayed).

---

## 7. Files in this review

- **This document:** `ORDER_FLOW_REVIEW.md` — flow, implementation notes, and inconsistencies.
- Privacy rules above are implemented in the codebase; remaining items in §4 are recommendations for product/backend changes.
