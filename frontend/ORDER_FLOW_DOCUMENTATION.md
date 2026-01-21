 Complete Order Flow Documentation
 From Landing Page to Service Completion

This document outlines the complete flow of an order from initial browsing to service completion, including all emails, status changes, and process steps.

---

 📋 **PHASE 1: ORDER PLACEMENT** 

 **Step 1.1: Customer Browses Services** (`/book`)
- **Page**: Landing/Booking Page (`app/book/page.tsx`)
- **Actions**:
  - Customer views available services (General & Recovery categories)
  - Services loaded from database via `GET /api/v1/products`
  - Customer can filter by category (All, General, Recovery)
  - For services with different adult/kids pricing, customer selects age group
  - Customer clicks "Add to Order" for desired services

 **Step 1.2: Cart Management**
- **Storage**: Cart stored in Zustand store (persisted to localStorage)
- **Actions**:
  - Items added to cart with quantity, pricing, age group
  - Customer can view cart summary
  - Customer clicks "View Cart & Checkout" → redirects to `/cart`

 **Step 1.3: Checkout Process** (`/cart` → `/checkout`)
- **Page**: Checkout Page (`app/checkout/page.tsx`)
- **Customer Information Collected**:
  - First Name, Last Name
  - Email Address
  - Phone Number
  - State (filtered by active barber locations)
  - City (filtered by selected state)
  - Location (service area)
  - Address (optional)
  - Additional Notes (optional)

 **Step 1.4: Payment Processing**
- **Payment Gateway**: Paystack Integration
- **Process**:
  1. Customer clicks "Pay Now"
  2. Paystack payment modal opens
  3. Customer completes payment
  4. Payment reference received from Paystack

 **Step 1.5: Order Creation** 
- **API**: `POST /api/v1/orders`
- **Location**: `app/api/v1/orders/route.ts`
- **Actions**:
  1. Order created in database with:
     - Order Number (format: `ORD-{timestamp}-{random}`)
     - Customer details (name, email, phone, location)
     - Order items (services, quantities, prices)
     - Total amount
     - Payment reference (from Paystack)
     - Payment status: `PAID`
     - Order status: `CONFIRMED` (if paid) or `PENDING` (if unpaid)
     - Job status: `null` (not yet assigned)
  
  2. **Email Sent**: Admin Notification Email
     - **Recipient**: `admin@bbslimited.online`
     - **Subject**: `New Order: {orderNumber} - ₦{totalAmount}`
     - **Content**: Order details, customer info, items list
     - **Sent Asynchronously**: Order creation doesn't wait for email

  3. **Response**: Returns order details with order number

 **Step 1.6: Order Confirmation Email**
- **API**: `POST /api/v1/emails/order-confirmation`
- **Location**: `app/api/v1/emails/order-confirmation/route.ts`
- **Recipient**: Customer email
- **Subject**: `Order Confirmation - {orderNumber}`
- **Content**:
  - Order reference number
  - Payment reference
  - Customer name and contact info
  - Service location details
  - Order items with quantities and prices
  - Total amount
  - What's next steps

 **Step 1.7: Success Page**
- **Page**: `app/checkout/success/page.tsx`
- **Display**:
  - Payment success confirmation
  - Payment reference number
  - Order number
  - Next steps information
  - Options to book another service or return home

---

 📧 **PHASE 2: ADMIN ASSIGNMENT**

 **Step 2.1: Admin Reviews Order**
- **Location**: Admin Dashboard (`/admin/orders`)
- **Actions**:
  - Admin views all pending orders
  - Admin can see:
    - Order number, customer details
    - Service location (city, location, address)
    - Total amount, payment status
    - Order items

 **Step 2.2: Admin Assigns Order to Barber**
- **API**: `POST /api/v1/admin/orders/assign`
- **Location**: `app/api/v1/admin/orders/assign/route.ts`
- **Process**:
  1. Admin selects a barber from active barbers
  2. System validates:
     - Barber exists and is ACTIVE
     - Order exists and is not already assigned
  3. Order updated:
     - `assignedBarberId` = selected barber ID
     - `jobStatus` = `PENDING_ACCEPTANCE`
     - `declineReason` cleared (if any)
  
  4. **⚠️ TODO**: Email notification to barber about assignment
     - Currently commented as TODO in code
     - Should notify barber about new order assignment

---

 ✋ **PHASE 3: BARBER ACCEPTANCE**

 **Step 3.1: Barber Views Assigned Orders**
- **Location**: Barber Dashboard (`/barber/orders`)
- **Display**: Orders with status `PENDING_ACCEPTANCE`

 **Step 3.2: Barber Accepts Order**
- **API**: `POST /api/v1/barber/orders/{id}/accept`
- **Location**: `app/api/v1/barber/orders/[id]/accept/route.ts`
- **Process**:
  1. Barber clicks "Accept Order"
  2. System validates:
     - Order is assigned to this barber
     - Order status is `PENDING_ACCEPTANCE`
  3. Order updated:
     - `jobStatus` = `ACCEPTED`
  
  4. **⚠️ TODO**: Email notification to customer
     - Should notify customer that barber accepted and is preparing
     - Currently commented as TODO

 **Step 3.3: Barber Declines Order** (Alternative)
- **API**: `POST /api/v1/barber/orders/{id}/decline`
- **Location**: `app/api/v1/barber/orders/[id]/decline/route.ts`
- **Process**:
  1. Barber clicks "Decline Order"
  2. Barber provides decline reason (optional)
  3. Order updated:
     - `jobStatus` = `DECLINED`
     - `declineReason` = provided reason
     - `assignedBarberId` = null (unassigned)
  
  4. **⚠️ TODO**: Email notification to admin
     - Should notify admin that barber declined
     - Admin needs to reassign order

---

 🚗 **PHASE 4: SERVICE EXECUTION**

 **Step 4.1: Barber Updates Status - On The Way**
- **API**: `POST /api/v1/barber/orders/{id}/status`
- **Location**: `app/api/v1/barber/orders/[id]/status/route.ts`
- **Process**:
  1. Barber clicks "On The Way" button
  2. System validates status transition is allowed
  3. Order updated:
     - `jobStatus` = `ON_THE_WAY`
  
  4. **⚠️ TODO**: Email notification to customer
     - Should send: "Your barber is on the way to your location"
     - Include estimated arrival time (if available)
     - Include barber contact information

 **Step 4.2: Barber Updates Status - Arrived**
- **API**: `POST /api/v1/barber/orders/{id}/status`
- **Process**:
  1. Barber clicks "Arrived" button
  2. Order updated:
     - `jobStatus` = `ARRIVED`
  
  3. **⚠️ TODO**: Email notification to customer
     - Should send: "Your barber has arrived at your location"
     - Customer can prepare for service

 **Step 4.3: Service Performed**
- **Status**: `ARRIVED`
- Barber performs the requested services at customer location

---

 ✅ **PHASE 5: SERVICE COMPLETION**

 **Step 5.1: Barber Marks Service Complete**
- **API**: `POST /api/v1/barber/orders/{id}/status`
- **Process**:
  1. Barber clicks "Mark Complete" button
  2. Order updated:
     - `jobStatus` = `COMPLETED`
     - `status` = `COMPLETED`
     - `paymentStatus` = `COMPLETED` (if was PENDING)
  
  3. **⚠️ TODO**: Completion email to customer
     - Should send: "Service Completed" email
     - Include service summary
     - Include link to rate/review the barber
     - Thank you message

 **Step 5.2: Customer Review** (Future Enhancement)
- **Status**: Service completed
- Customer can optionally:
  - Rate the barber (1-5 stars)
  - Leave a review/comment
  - Provide feedback

---

 📊 **ORDER STATUS FLOW SUMMARY**

 **Order Status (`status` field)**
```
PENDING → CONFIRMED → PROCESSING → COMPLETED
   ↓           ↓            ↓           ↓
(Unpaid)   (Paid)    (In Progress) (Done)
            ↓
        CANCELLED (if cancelled)
```

 **Job Status (`jobStatus` field)**
```
null → PENDING_ACCEPTANCE → ACCEPTED → ON_THE_WAY → ARRIVED → COMPLETED
                    ↓
              DECLINED (if barber declines)
```

 **Payment Status (`paymentStatus` field)**
```
PENDING → PAID → COMPLETED
   ↓       ↓        ↓
FAILED  (Paid)  (Service done)
```

---

 📧 **EMAIL FLOW SUMMARY**

 **Current Email Implementations** ✅
1. **Order Confirmation Email** (Customer)
   - Sent immediately after payment
   - Includes order details, items, location
   - Status: ✅ Implemented

2. **Admin Notification Email** (Admin)
   - Sent when new order is created
   - Includes full order details
   - Status: ✅ Implemented

 **Missing Email Implementations** ⚠️
1. **Barber Assignment Email** (Barber)
   - When admin assigns order to barber
   - Should include customer details, location, services
   - Status: ⚠️ TODO in code

2. **Barber Acceptance Email** (Customer)
   - When barber accepts order
   - Should confirm barber is preparing
   - Status: ⚠️ TODO in code

3. **Barber Decline Email** (Admin)
   - When barber declines order
   - Should notify admin to reassign
   - Status: ⚠️ TODO in code

4. **On The Way Email** (Customer)
   - When barber updates status to ON_THE_WAY
   - Should include barber contact info
   - Status: ⚠️ TODO in code

5. **Barber Arrived Email** (Customer)
   - When barber updates status to ARRIVED
   - Customer can prepare for service
   - Status: ⚠️ TODO in code

6. **Service Complete Email** (Customer)
   - When service is completed
   - Should include review/rating link
   - Status: ⚠️ TODO in code

---

 🔄 **COMPLETE PROCESS FLOW DIAGRAM**

```
LANDING PAGE (/book)
    ↓
CUSTOMER ADDS SERVICES TO CART
    ↓
CHECKOUT PAGE (/checkout)
    ↓
CUSTOMER FILLS INFORMATION
    ↓
PAYSTACK PAYMENT PROCESSING
    ↓
✅ PAYMENT SUCCESSFUL
    ↓
ORDER CREATED IN DATABASE
    ├─→ Email: Order Confirmation (Customer) ✅
    └─→ Email: New Order Notification (Admin) ✅
    ↓
SUCCESS PAGE (/checkout/success)
    ↓
ADMIN DASHBOARD (/admin/orders)
    ↓
ADMIN ASSIGNS ORDER TO BARBER
    ├─→ jobStatus = PENDING_ACCEPTANCE
    └─→ Email: Order Assignment (Barber) ⚠️ TODO
    ↓
BARBER DASHBOARD (/barber/orders)
    ↓
BARBER ACCEPTS ORDER
    ├─→ jobStatus = ACCEPTED
    └─→ Email: Barber Accepted (Customer) ⚠️ TODO
    ↓
BARBER CLICKS "ON THE WAY"
    ├─→ jobStatus = ON_THE_WAY
    └─→ Email: Barber On The Way (Customer) ⚠️ TODO
    ↓
BARBER CLICKS "ARRIVED"
    ├─→ jobStatus = ARRIVED
    └─→ Email: Barber Arrived (Customer) ⚠️ TODO
    ↓
BARBER PERFORMS SERVICE
    ↓
BARBER CLICKS "MARK COMPLETE"
    ├─→ jobStatus = COMPLETED
    ├─→ status = COMPLETED
    └─→ Email: Service Complete (Customer) ⚠️ TODO
    ↓
END OF SERVICE
    ↓
(Optional) CUSTOMER REVIEW
```

---

 📝 **NOTES FOR IMPLEMENTATION**

 **Priority Email Implementations**:
1. **High Priority**:
   - Barber Assignment Email (for barber awareness)
   - Service Complete Email (for customer satisfaction)
   - On The Way Email (for customer experience)

2. **Medium Priority**:
   - Barber Acceptance Email
   - Barber Arrived Email

3. **Low Priority**:
   - Barber Decline Email (admin can see in dashboard)

 **Current Email Service**:
- Email service configured: ✅
- SMTP: Hostinger (`admin@bbslimited.online`)
- Email templates: ✅ Available in `lib/server/emailTemplates.ts`
- Email service class: ✅ Available in `lib/server/emailService.ts`

 **Testing Checklist**:
- [ ] Order creation flow
- [ ] Payment processing
- [ ] Order confirmation email
- [ ] Admin notification email
- [ ] Order assignment
- [ ] Barber acceptance
- [ ] Status updates
- [ ] Service completion

---

 🔗 **RELATED FILES**

- **Order API**: `app/api/v1/orders/route.ts`
- **Order Assignment**: `app/api/v1/admin/orders/assign/route.ts`
- **Barber Accept**: `app/api/v1/barber/orders/[id]/accept/route.ts`
- **Barber Decline**: `app/api/v1/barber/orders/[id]/decline/route.ts`
- **Status Update**: `app/api/v1/barber/orders/[id]/status/route.ts`
- **Email Service**: `lib/server/emailService.ts`
- **Email Templates**: `lib/server/emailTemplates.ts`
- **Order Confirmation Email**: `app/api/v1/emails/order-confirmation/route.ts`
- **Checkout Page**: `app/checkout/page.tsx`
- **Booking Page**: `app/book/page.tsx`
- **Schema**: `prisma/schema.prisma` (Order, OrderItem models)