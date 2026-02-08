# BBS (Barber Booking System) — Full System Review

A deep review of every major function and component across the entire codebase.

---

## 1. Project Overview

| Aspect | Details |
|--------|--------|
| **Name** | BBS — Barber Booking System |
| **Type** | Full-stack monorepo |
| **Root** | `package.json` — scripts: `dev`, `dev:frontend`, `dev:backend`, `build`, `start`, `install:all`, `clean` |
| **Frontend** | Next.js (App Router), React, TypeScript, CSS Modules, Tailwind |
| **Backend** | Express (Node), Socket.io, minimal API (health + email) |
| **Database** | PostgreSQL via Prisma (frontend holds the schema and migrations) |
| **Auth** | JWT in httpOnly cookies (access 1h, refresh 7d), Session table |
| **Payments** | Paystack (verify on order creation) |
| **Email** | Nodemailer (SMTP or Ethereal in dev) |

---

## 2. Data Model (Prisma Schema)

**Location:** `frontend/prisma/schema.prisma`

### Core entities

| Model | Purpose |
|-------|--------|
| **User** | Auth: email, password, name, phone, role (CUSTOMER, BARBER, ADMIN, REP, MANAGER, VIEWER), password reset, sessions |
| **Barber** | Linked to User; barberId, bio, experience, specialties, ratingAvg, totalReviews, status (ACTIVE/INACTIVE/SUSPENDED/PENDING_APPROVAL), commissionRate, isOnline, city/state/address, availability |
| **Customer** | Linked to User; customerId, preferredBarber, loyaltyPoints, membershipType, status, address, consent fields, notes, tags |
| **Product** | Services: title, description, adultPrice, kidsPrice, category (GENERAL/RECOVERY), before/after images, isActive, displayOrder, stockQuantity, reorderPoint |
| **Order** | orderNumber, customerName/Email/Phone, city, location, address, totalAmount, paymentReference, paymentStatus, status, jobStatus, assignedBarberId, customerId, declineReason |
| **OrderItem** | orderId, productId, title, quantity, ageGroup, unitPrice, totalPrice |
| **Review** | orderId, customerId, barberId, rating (1–5), comment, barberResponse, status (NEW/RESPONDED/ESCALATED/RESOLVED/IGNORED), assignedToId, adminResponse, internalNotes, SLA |
| **ReviewAuditLog** | reviewId, performedBy, action, metadata |
| **Session** | userId, refreshToken, userAgent, ipAddress, expiresAt (for JWT refresh) |
| **BarberApplication** | Apply to become barber: name, email, phone, address, documents (CV, licence, letter), status (PENDING/APPROVED/REJECTED) |

### Supporting / analytics

| Model | Purpose |
|-------|--------|
| **Booking** | Legacy booking (customerId, barberId, serviceId, date/time, status, payment) — separate from Order flow |
| **Service** | Barber-owned services (used with Booking, not Product/Order) |
| **TimeSlot**, **BarberAvailability** | Barber scheduling |
| **Payment** | Linked to Booking (legacy) |
| **Notification** | In-app notifications for User |
| **SupportTicket** | Customer support |
| **BarberPayout** | Barber payouts (period, amount, status) |
| **AnalyticsAuditLog** | VIEW_FINANCIALS, EXPORT_*, SEND_WEEKLY_REPORT |
| **TrafficEvent** | Page views: url, sessionId, referrer, device, country, city |
| **OperationalMetric** | Uptime, response time, error rate |
| **Campaign** | Marketing campaigns (spend, type) |
| **InventoryMovement** | Product stock IN/OUT/ADJUSTMENT/RETURN |
| **DataRetentionPolicy** | Per-entity retention months, archive flag |
| **Integration** | External integrations (type, config, isActive) |
| **CustomerNote**, **CustomerTag**, **CustomerAuditLog**, **CustomerCommunication**, **CustomerPreference** | CRM for customers |

---

## 3. Authentication & Authorization

### 3.1 Frontend API auth (`frontend/app/api/v1/utils/auth.ts`)

| Function | Purpose |
|----------|--------|
| **getTokenFromRequest(request)** | Reads JWT from cookie `access_token` or `Authorization: Bearer` |
| **verifyToken(token)** | Validates JWT with JWT_SECRET, checks user exists and isActive, returns AuthUser |
| **verifyAdminOrRep(request)** | Admin, REP, MANAGER, or VIEWER; VIEWER restricted to GET/HEAD |
| **isViewOnly(user)** | True if role === VIEWER |
| **verifyAdmin(request)** | Admin only |
| **verifyBarber(request)** | Barber only |
| **verifyRep(request)** | REP only |
| **verifyUser(request)** | Any authenticated user |

### 3.2 Admin permissions (`frontend/app/api/v1/admin/utils.ts`)

| Function | Purpose |
|----------|--------|
| **hasPermission(user, permission)** | ADMIN: all; VIEWER: view_* only; MANAGER/REP: list of permissions (view_dashboard, view_orders, assign_orders, edit_customers, etc.) |

### 3.3 Client-side auth (`frontend/lib/auth.ts`)

| Function | Purpose |
|----------|--------|
| **getUserData()** | Reads `user_data` from localStorage (set after login) |
| **setUserData(user)** | Saves user to localStorage |
| **clearAuthData()** | Calls POST /api/v1/auth/logout (clears cookies), then removes user_data |
| **isAuthenticated()** | getUserData() !== null |
| **hasRole(role)** | user.role === role |
| **isAdmin()** | hasRole('ADMIN') |
| **isAdminOrRep()** | ADMIN, REP, MANAGER, or VIEWER |
| **isViewOnly()** | role === VIEWER |
| **hasPermission(permission)** | Rep/Admin permission list check |
| **getAuthHeaders()** | Returns {} (cookies sent via credentials) |
| **fetchAuth(url, options)** | fetch with credentials: 'include'; on 401 tries refresh then redirects to /login |

---

## 4. Backend (Express — `backend/`)

### 4.1 Server (`backend/src/server.ts`)

- **Express** + **cors**, **helmet**, **express.json**
- **HTTP server** + **Socket.io** (CORS for frontend origin)
- **Routes:** `/api/v1` → `apiRoutes`
- **Socket:** `connection`, `join:room` (user room), `disconnect`
- **Health:** GET `/health` → status, timestamp, environment
- **Global error handler** and 404 handler
- On listen: verify email service connection

### 4.2 Routes (`backend/src/routes/index.ts`)

| Method | Path | Handler | Purpose |
|--------|------|--------|--------|
| GET | /health | inline | API healthy |
| POST | /emails/order-confirmation | emailController.sendOrderConfirmation | Send order confirmation email |
| POST | /emails/test | emailController.testEmail | Send test email |
| GET | / | inline | API info and endpoint list |

### 4.3 Other backend

- **Config:** `backend/src/config/env.ts`, `backend/src/config/database.ts`
- **Middleware:** `backend/src/middleware/auth.ts`
- **Services:** `backend/src/services/emailService.ts`, `backend/src/services/response.ts`
- **Controllers:** `backend/src/controllers/emailController.ts`
- **Utils:** `backend/src/utils/emailTemplates.ts`

*Note: Primary API lives in the **Next.js frontend** (App Router API routes). The Express backend is minimal and used for health and email (and can be bypassed if frontend uses its own email service).*

---

## 5. Frontend API Routes (Next.js App Router)

All under `frontend/app/api/v1/`. Auth and behavior summarized per route.

### 5.1 Auth

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| POST | /auth/login | None | Body: email, password. bcrypt compare, create Session, issue access + refresh JWT, set httpOnly cookies, return user (no barber email/phone to client). |
| GET | /auth/me | verifyUser | Return current user + barber/customer profile. |
| POST | /auth/refresh | Cookie refresh_token | Validate session, issue new access token, extend refresh cookie. |
| POST, GET | /auth/logout | Optional | Delete session by refresh_token, clear access_token and refresh_token cookies. |
| POST | /auth/reset-password | None | Body: token, newPassword. Validate token, hash password, update user, clear reset token. |
| GET | /auth/verify-reset-token | None | Query: token. Validate token and return valid/invalid. |

### 5.2 Health

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /health | None | Return ok / timestamp. |

### 5.3 Products (services catalog)

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /products | None | Query: category, active. List products (default active only), ordered by displayOrder, createdAt. |
| POST | /products | verifyAdmin | Body: title, description, adultPrice, kidsPrice, category, beforeImage, afterImage, isActive, displayOrder. Create product. |
| GET | /products/[id] | None | Get single product. |
| PUT | /products/[id] | verifyAdmin | Update product. |
| DELETE | /products/[id] | verifyAdmin | Delete product. |

### 5.4 Orders

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| POST | /orders | Admin/Rep/Customer (no VIEWER) | Create order: validate body (customerName, customerEmail, customerPhone, city, location, items, totalAmount). If paymentReference + Paystack → verify with Paystack and set paymentStatus/status. Find or create User/Customer by email (temp password + reset token if new). Create Order + OrderItems. Background: customer confirmation email + admin new-order email. |
| GET | /orders | verifyAdminOrRep | Query: status, limit, offset. List orders with items, assignedBarber; pagination. |
| GET | /orders/[id] | verifyUser + CUSTOMER | Order must belong to customer (customerId). Return order with items, assignedBarber (name, avatar only — no barber contact), review. |

### 5.5 Admin — Orders

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| POST | /admin/orders/assign | verifyAdmin | Body: orderId, barberId. Transaction: order exists, not completed, barber ACTIVE, isOnline, within BarberAvailability for today. Update order assignedBarberId, jobStatus PENDING_ACCEPTANCE. Emails: barber (new order assigned), customer (barber assigned). Privacy: no customer phone/email to barber; no barber phone/email to customer. |

### 5.6 Barber — Orders

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /barber/orders | verifyBarber | List orders assigned to this barber (jobStatus, items, customer name/address only — no phone/email). |
| POST | /barber/orders/[id]/accept | verifyBarber | Order must be assigned to barber and jobStatus PENDING_ACCEPTANCE. Set jobStatus ACCEPTED. Email customer “Barber Accepted”. |
| POST | /barber/orders/[id]/decline | verifyBarber | Body: reason. Set jobStatus DECLINED, declineReason. Email admin “Order declined” (reassign). |
| POST | /barber/orders/[id]/status | verifyBarber | Body: status. Allowed: ACCEPTED→ON_THE_WAY→ARRIVED→COMPLETED. On COMPLETED set order status and paymentStatus COMPLETED. Customer emails: On the way, Arrived, Completed (with review link /review/[orderId]). |

### 5.7 Barber — Profile & status

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /barber/profile | verifyBarber | Return barber profile (user + barber record). |
| PUT | /barber/profile | verifyBarber | Update barber bio, experience, specialties, city, address, etc. |
| GET | /barber/online-status | verifyBarber | Return current isOnline. |
| PUT | /barber/online-status | verifyBarber | Body: isOnline. Toggle online status. |
| GET | /barber/earnings | verifyBarber | Return earnings summary (period, completed orders, commission). |

### 5.8 Reviews

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| POST | /reviews | verifyUser + CUSTOMER | Body: orderId, rating, comment. Order must be customer’s, jobStatus COMPLETED, has assignedBarber, no existing review. Create Review; in transaction update Barber ratingAvg and totalReviews. |
| GET | /reviews | None | Query: barberId or orderId. List visible reviews with customer name, orderNumber. |
| PUT | /reviews/[id] | (varies) | Update review (e.g. barber response). |

### 5.9 Admin — Reviews

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /admin/reviews | verifyAdminOrRep | List reviews with filters, pagination. |
| GET | /admin/reviews/filter-options | verifyAdminOrRep | Return filter options (status, rating, etc.). |
| GET | /admin/reviews/analytics | verifyAdminOrRep | Review analytics (sentiment, themes, distribution). |
| GET | /admin/reviews/[id]/detail | verifyAdminOrRep | Full review detail for admin. |
| PUT | /admin/reviews/[id] | verifyAdminOrRep | Update review (status, admin response, internal notes, assign, etc.). |
| DELETE | /admin/reviews/[id] | verifyAdmin | Delete/hide review. |

### 5.10 Admin — Barbers

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /admin/barbers | verifyAdminOrRep | List barbers with filters. |
| POST | /admin/barbers | verifyAdmin | Create barber (invite). |
| GET | /admin/barbers/[id]/detail | verifyAdminOrRep | Barber detail. |
| PUT | /admin/barbers/[id] | verifyAdmin | Update barber. |
| POST | /admin/barbers/[id]/activate | verifyAdmin | Set status ACTIVE. |
| POST | /admin/barbers/[id]/suspend | verifyAdmin | Set status SUSPENDED. |
| POST | /admin/barbers/[id]/terminate | verifyAdmin | Terminate (with reason). |
| POST | /admin/barbers/invite | verifyAdmin | Invite barber (email). |
| GET | /admin/barbers/verify-invitation | None | Query: token. Verify invite token. |
| GET | /admin/barbers/metrics | verifyAdminOrRep | Barber metrics (earnings, orders, ratings). |

### 5.11 Admin — Barber applications

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /admin/barber-applications | verifyAdmin | List applications. |
| POST | /admin/barber-applications | None (or admin) | Submit application (name, email, phone, address, documents). |
| POST | /admin/barber-applications/upload | verifyAdminOrRep | Upload document (CV, licence, letter). |
| POST | /admin/barber-applications/[id]/approve | verifyAdmin | Approve application (create User + Barber). |
| POST | /admin/barber-applications/[id]/decline | verifyAdmin | Decline with reason. |

### 5.12 Admin — Customers

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /admin/customers | verifyAdminOrRep | List customers, search, filters. |
| GET | /admin/customers/analytics | verifyAdminOrRep | Customer analytics (segments, CLV, etc.). |
| GET | /admin/customers/[id] | verifyAdminOrRep | Customer detail. |
| PUT | /admin/customers/[id]/edit | verifyAdminOrRep | Edit customer. |
| GET | /admin/customers/[id]/notes | verifyAdminOrRep | List notes. |
| POST | /admin/customers/[id]/notes | verifyAdminOrRep | Add note. |
| GET | /admin/customers/[id]/tags | verifyAdminOrRep | List tags. |
| POST | /admin/customers/[id]/tags | verifyAdminOrRep | Add tag. |
| DELETE | /admin/customers/[id]/tags | verifyAdminOrRep | Remove tag. |
| GET | /admin/customers/[id]/audit | verifyAdminOrRep | Audit log. |
| GET | /admin/customers/[id]/export | verifyAdminOrRep | Export customer data. |
| POST | /admin/customers/[id]/merge | verifyAdmin | Merge into another customer. |
| POST | /admin/customers/[id]/anonymize | verifyAdmin | Anonymize (GDPR-style). |
| POST | /admin/customers/[id]/actions | verifyAdminOrRep | Generic action (e.g. flag, block). |

### 5.13 Admin — Analytics & financials

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /admin/overview | verifyAdminOrRep | Dashboard overview KPIs. |
| GET | /admin/financials | verifyAdminOrRep | Financial analytics (revenue, orders, periods, filters). |
| GET | /admin/financials/filter-options | verifyAdminOrRep | Filter options for financials. |
| GET | /admin/transactions | verifyAdminOrRep | Transaction list. |
| GET | /admin/analytics/traffic | verifyAdminOrRep | Site traffic (TrafficEvent: page views, sessions, device, country, city). |
| GET | /admin/analytics/realtime | verifyAdminOrRep | Live sessions, orders today, active barbers. |
| GET | /admin/analytics/operations | verifyAdminOrRep | Operational metrics (uptime, errors, tickets). |
| GET | /admin/analytics/marketing | verifyAdminOrRep | Campaigns, spend, communications. |
| GET | /admin/analytics/inventory | verifyAdminOrRep | Inventory (products, low stock, turnover). |
| POST | /admin/audit-log | verifyAdminOrRep | Log analytics action (VIEW_FINANCIALS, EXPORT_*, etc.). |

### 5.14 Admin — Reports & settings

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| POST | /admin/reports/weekly-email | verifyAdminOrRep | Send weekly report to requester email. |
| GET | /admin/reports/weekly-email-cron | Cron (CRON_SECRET) | Scheduled weekly report (e.g. Vercel Cron). |
| GET | /admin/reports/scheduled-export-cron | Cron | Scheduled export (CSV) to configured emails. |
| GET | /admin/settings/data-retention | verifyAdminOrRep | Get data retention policies. |
| PUT | /admin/settings/data-retention | verifyAdmin | Update retention policies. |
| GET | /admin/settings/integrations | verifyAdminOrRep | List integrations. |
| GET | /admin/team | verifyAdminOrRep | Team members (admin users). |
| POST | /admin/team | verifyAdmin | Add team member. |

### 5.15 Public / other

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /barbers | None | List active barbers (public). |
| GET | /locations | None | States and cities from active barbers (for checkout dropdown). |
| POST | /contact | None | Contact form: validate, send email to ADMIN_EMAIL, replyTo sender. |
| POST | /analytics/track | None | Body: url, referrer, device, sessionId. Optional: country, city (else from Vercel geo). Insert TrafficEvent. |
| POST | /upload/image | (varies) | Upload image (e.g. Cloudinary). |
| POST | /upload/document | (varies) | Upload document. |
| POST | /emails/order-confirmation | (varies) | Send order confirmation (used by backend or internal). |
| POST | /emails/test | verifyAdmin | Send test email. |

---

## 6. Frontend Application (Pages & Layouts)

### 6.1 Public pages

| Route | File | Purpose |
|-------|------|--------|
| / | app/page.tsx | Home/landing. |
| /book | app/book/page.tsx | Service catalog (Product list), filter by category (all/general/recovery), age selection (kids/adult), add to order (cart). Before/after slider per product. Order summary sidebar; “View Cart & Checkout”. Notification popup when service added (mobile-responsive). |
| /book layout | app/book/layout.tsx | Wraps book with layout. |
| /cart | app/cart/page.tsx | Cart: list items, update quantity, remove, “Proceed to Checkout”. Empty state. |
| /cart layout | app/cart/layout.tsx | Cart layout. |
| /checkout | app/checkout/page.tsx | Customer form (name, email, phone, state, city, location, address, notes). Locations from GET /api/v1/locations. Paystack: initializePayment, onSuccess → POST /orders with paymentReference, then redirect to /checkout/success and clearCart. |
| /checkout/success | app/checkout/success/page.tsx | Order success message. |
| /checkout layout | app/checkout/layout.tsx | Checkout layout. |
| /contact | app/contact/page.tsx | Contact form; POST /api/v1/contact. |
| /contact layout | app/contact/layout.tsx | Contact layout. |
| /review/[orderId] | app/review/[orderId]/page.tsx | Load order GET /orders/[id] (customer auth), submit review POST /reviews. |
| /login | app/login/page.tsx | Login form; POST /auth/login, set user_data, redirect. |
| /reset-password | app/reset-password/page.tsx | Reset password (token from query). |
| /become-barber | app/become-barber/page.tsx | Barber application form. |
| /become-barber layout | app/become-barber/layout.tsx | Layout. |
| /barber-recruit | app/barber-recruit/page.tsx | Barber recruitment (admin-facing or public). |
| /barber-recruit layout | app/barber-recruit/layout.tsx | Layout. |
| not-found | app/not-found.tsx | 404 page. |

### 6.2 Admin (protected)

| Route | File | Purpose |
|-------|------|--------|
| /admin | app/admin/page.tsx | Dashboard home. |
| /admin layout | app/admin/layout.tsx | AuthGuard (ADMIN_OR_REP), AdminSidebar. |
| /admin/orders | app/admin/orders/page.tsx | Orders list, assign barber, filters. |
| /admin/barbers | app/admin/barbers/page.tsx | Barbers list, invite, activate/suspend/terminate, modals. |
| /admin/barbers/[id] | app/admin/barbers/[id]/page.tsx | Barber detail. |
| /admin/customers | app/admin/customers/page.tsx | Customers list, notes, tags, filters. |
| /admin/customers/[id] | app/admin/customers/[id]/page.tsx | Customer detail, notes, tags, edit, merge, export, anonymize. |
| /admin/customers/analytics | app/admin/customers/analytics/page.tsx | Customer analytics. |
| /admin/reviews | app/admin/reviews/page.tsx | Reviews list, filters, detail modal, respond, assign. |
| /admin/financials | app/admin/financials/page.tsx | Financial dashboard (revenue, traffic, orders, exports, realtime). |
| /admin/products | app/admin/products/page.tsx | Products (services) CRUD. |
| /admin/services | app/admin/services/page.tsx | Services (Barber services if used). |
| /admin/team | app/admin/team/page.tsx | Team management. |

### 6.3 Barber (protected)

| Route | File | Purpose |
|-------|------|--------|
| /barber | app/barber/page.tsx | Barber dashboard: assigned orders, accept/decline, status updates. |
| /barber layout | app/barber/layout.tsx | AuthGuard (BARBER). |
| /barber/appointments | app/barber/appointments/page.tsx | Appointments view. |
| /barber/profile | app/barber/profile/page.tsx | Profile edit. |
| /barber/earnings | app/barber/earnings/page.tsx | Earnings summary. |

### 6.4 Shared components

| Component | Purpose |
|-----------|--------|
| LayoutWrapper | app/layout.tsx wrapper: TrafficTracker, global layout. |
| TrafficTracker | components/TrafficTracker.tsx | POST /api/v1/analytics/track on route change (url, referrer, device, sessionId). |
| Header | components/shared/Header.tsx | Nav, auth links. |
| Footer | components/shared/Footer.tsx | Footer. |
| AuthGuard | components/AuthGuard.tsx | Checks isAuthenticated(), requiredRole (e.g. ADMIN_OR_REP, BARBER); redirects to /login or role-specific home. |
| AdminSidebar | components/admin/AdminSidebar.tsx | Admin nav. |
| RatingDisplay | components/shared/RatingDisplay.tsx | Star rating display. |

### 6.5 Legacy / other

| Item | Purpose |
|------|--------|
| pages/_app.tsx, pages/_document.tsx | Pages router (if still used). |

---

## 7. Frontend Lib

### 7.1 API client (`frontend/lib/api.ts`)

- **apiClient:** axios instance, baseURL `/api/v1`, withCredentials true.
- **Interceptor:** 401 → POST /auth/refresh, retry; else clear user_data and redirect to /login.
- **contactApi.submit** → POST /contact.
- **productApi:** getAll(category), getById(id), create, update, delete.
- **orderApi:** create(orderData), getAll(params).
- **emailApi:** sendOrderConfirmation, sendTestEmail.

### 7.2 Cart store (`frontend/lib/store/cartStore.ts`)

- **Zustand store:** items (OrderItem[]).
- **addItem(item):** merge by key (productId-ageGroup), increment quantity; persist to localStorage (`bbs-cart-storage`).
- **removeItem(key), updateQuantity(key, quantity), clearCart:** update state and localStorage.
- **getTotal(), getItemCount().**
- **loadFromStorage(), saveToStorage().**

### 7.3 Utils (`frontend/lib/utils.ts`)

- **cn(...inputs):** clsx + tailwind-merge.
- **formatDate(date), formatTime(date):** locale formatting.
- **getSlotsLeftForToday(serviceId, min, max):** deterministic pseudo-slots per day/service (urgency messaging).

### 7.4 Server-only (`frontend/lib/server/`)

- **emailService.ts:** Nodemailer (SMTP or Ethereal). sendEmail(), verifyConnection().
- **emailTemplates.ts:** HTML/text templates: orderConfirmation, barberAssignment, customerBarberAssigned, barberAccepted, onTheWay, arrived, completed (with review link), barberDeclined (admin), etc.
- **cloudinaryService.ts:** Image upload to Cloudinary (if used).

### 7.5 Database (`frontend/lib/prisma.ts`)

- **PrismaClient** singleton (global in dev to avoid many instances).

---

## 8. Key End-to-End Flows

### 8.1 Customer order flow

1. **Book** (/book): Browse products, add to cart (cartStore + localStorage). Notification popup (mobile-responsive).
2. **Cart** (/cart): Review, proceed to checkout.
3. **Checkout** (/checkout): Fill form, locations from /locations. Pay with Paystack; on success POST /orders with paymentReference. Order created, Paystack verified, customer + admin emails. Redirect to /checkout/success, clearCart.

### 8.2 Admin assignment and barber flow

1. **Admin** (/admin/orders): Assign barber to paid order → POST /admin/orders/assign. Barber must be ACTIVE, isOnline, within availability. Barber gets “New Order Assigned” email; customer gets “Barber Assigned” email.
2. **Barber** (/barber): Sees assigned orders. Accept → POST barber/orders/[id]/accept (customer email “Barber Accepted”); or Decline → POST barber/orders/[id]/decline (admin email “Order declined”).
3. **Barber status:** ON_THE_WAY → ARRIVED → COMPLETED via POST barber/orders/[id]/status. Customer gets emails at each step; on COMPLETED, email includes review link /review/[orderId].

### 8.3 Review flow

1. Customer opens /review/[orderId] (from email or when logged in). GET /orders/[id] (customer auth).
2. Submit rating/comment → POST /reviews. Order must be completed, have barber, no existing review. Review created; barber ratingAvg and totalReviews updated.

### 8.4 Auth flow

1. **Login:** POST /auth/login → cookies set (access_token, refresh_token), user_data in localStorage.
2. **Protected routes:** AuthGuard checks localStorage + role; API routes use verify* and cookies.
3. **Refresh:** 401 on API → POST /auth/refresh with refresh_token cookie → new access_token.
4. **Logout:** POST /auth/logout → session deleted, cookies cleared; clear user_data.

---

## 9. Summary Table: All API Endpoints (Quick Reference)

| Domain | Method | Path | Auth |
|--------|--------|------|------|
| Auth | POST | /auth/login | — |
| Auth | GET | /auth/me | User |
| Auth | POST | /auth/refresh | Cookie |
| Auth | POST, GET | /auth/logout | — |
| Auth | POST | /auth/reset-password | — |
| Auth | GET | /auth/verify-reset-token | — |
| Health | GET | /health | — |
| Products | GET, POST | /products | —, Admin |
| Products | GET, PUT, DELETE | /products/[id] | —, Admin |
| Orders | POST, GET | /orders | Customer/Admin/Rep, Admin/Rep |
| Orders | GET | /orders/[id] | Customer (owner) |
| Admin | POST | /admin/orders/assign | Admin |
| Barber | GET | /barber/orders | Barber |
| Barber | POST | /barber/orders/[id]/accept | Barber |
| Barber | POST | /barber/orders/[id]/decline | Barber |
| Barber | POST | /barber/orders/[id]/status | Barber |
| Barber | GET, PUT | /barber/profile | Barber |
| Barber | GET, PUT | /barber/online-status | Barber |
| Barber | GET | /barber/earnings | Barber |
| Reviews | POST, GET | /reviews | Customer / — |
| Reviews | PUT | /reviews/[id] | — |
| Admin | GET, PUT, DELETE | /admin/reviews, /admin/reviews/[id] | Admin/Rep |
| Admin | GET | /admin/reviews/filter-options, analytics, [id]/detail | Admin/Rep |
| Admin | GET, POST, PUT, POST×3 | /admin/barbers, [id], [id]/detail, invite, [id]/activate, suspend, terminate | Admin/Rep, Admin |
| Admin | GET | /admin/barbers/verify-invitation, metrics | —, Admin/Rep |
| Admin | GET, POST, upload, [id]/approve, [id]/decline | /admin/barber-applications* | Admin / mixed |
| Admin | GET, GET, PUT, GET×2, POST×2, GET, POST, GET, export, merge, anonymize, actions | /admin/customers* | Admin/Rep |
| Admin | GET | /admin/overview, financials, transactions, analytics/*, audit-log, settings/*, team | Admin/Rep |
| Admin | POST, GET (cron) | /admin/reports/weekly-email, weekly-email-cron, scheduled-export-cron | Admin/Rep, Cron |
| Public | GET | /barbers, /locations | — |
| Public | POST | /contact, /analytics/track | — |
| Upload | POST | /upload/image, /upload/document | (varies) |
| Email | POST | /emails/order-confirmation, /emails/test | (varies), Admin |

---

## 10. Document References

- **ORDER_FLOW_REVIEW.md** — Order flow, email matrix, privacy (barber vs customer contact), past fixes (Paystack, review link, decline email).
- **SPEC_DONE_VS_NOT_DONE.md** — Analytics/financials spec vs implementation (revenue, traffic, customer/order/barber analytics, reports, exports, retention, roles).

This document is the single reference for “every function of the entire system” at a high level; for line-level behavior, the code and the two docs above are the source of truth.
