# Paystack API Configuration Template

This document shows you exactly how to configure your Paystack API keys for Vercel deployment.

## Paystack API Key Format

Paystack provides two types of keys:

### 1. Test Keys (for development/testing)
- **Public Key**: Starts with `pk_test_`
- **Secret Key**: Starts with `sk_test_`

### 2. Live Keys (for production)
- **Public Key**: Starts with `pk_live_`
- **Secret Key**: Starts with `sk_live_`

## Getting Your Paystack Keys

### Step 1: Sign up for Paystack
1. Go to https://paystack.com
2. Sign up for an account
3. Complete email verification

### Step 2: Get Your API Keys
1. Log in to Paystack Dashboard: https://dashboard.paystack.com
2. Click on **Settings** (gear icon in top right)
3. Click on **API Keys & Webhooks**
4. You'll see:
   - **Test Public Key**: `pk_test_...` (starts with pk_test_)
   - **Test Secret Key**: `sk_test_...` (starts with sk_test_) - NOT needed for frontend
   - **Live Public Key**: `pk_live_...` (starts with pk_live_) - after going live
   - **Live Secret Key**: `sk_live_...` (starts with sk_live_) - NOT needed for frontend

**Important**: You only need the PUBLIC keys (`pk_test_` or `pk_live_`) for the frontend. Never use secret keys in frontend code.

## Vercel Environment Variable Configuration

### For Development/Testing

In Vercel Dashboard → Settings → Environment Variables, add:

```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Example Format:**
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Replace with your actual key from Paystack dashboard)

### For Production

After going live on Paystack, update to:

```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Example:**
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_1234567890abcdefghijklmnopqrstuvwxyz1234567890
```

## Complete Environment Variables Template for Vercel

Here's a complete template of all environment variables you need in Vercel:

```env
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key_here

# Email Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@bbslimited.online
SMTP_PASS=Bbspasskey@2025
EMAIL_FROM=admin@bbslimited.online

# App Configuration
APP_NAME=Barber Booking System
NODE_ENV=production
```

## Paystack Public Key Examples

### Test Key Example Format
```
pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Replace x's with your actual key from Paystack dashboard)

### Live Key Example Format (after going live)
```
pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Replace x's with your actual key from Paystack dashboard)

## How to Use in Your Code

Your checkout page already uses it like this:

```typescript
// In frontend/app/checkout/page.tsx
const publicKey = process.env.NEXT_PUBLIC_PUBLIC_KEY || 'pk_test_your_public_key_here';
```

The `NEXT_PUBLIC_` prefix makes it available in the browser (required for Paystack).

## Important Notes

1. **Security**: 
   - ✅ Public keys can be exposed in frontend code (they're meant to be public)
   - ❌ Never use Secret Keys in frontend code
   - ❌ Never commit secret keys to Git

2. **Test Mode**:
   - Use test keys during development
   - Test cards work with test keys
   - No real money is charged

3. **Production Mode**:
   - Switch to live keys when going live
   - Real payments will be processed
   - Requires completing Paystack onboarding

4. **Key Format**:
   - Always starts with `pk_test_` or `pk_live_`
   - Usually 60-70 characters long
   - No spaces or special characters (except underscore)

## Testing Your Configuration

After setting up in Vercel, test with:

1. **Test Card**:
   - Card Number: `4084084084084081`
   - CVV: Any 3 digits (e.g., `123`)
   - Expiry: Any future date (e.g., `12/25`)
   - PIN: Any 4 digits (e.g., `0000`)
   - OTP: Any 6 digits (e.g., `123456`)

2. **Verify in Browser Console**:
   - Open browser dev tools
   - Check if `process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set
   - Should show your public key (not undefined)

## Checklist

- [ ] Created Paystack account
- [ ] Got test public key from dashboard
- [ ] Added `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` to Vercel environment variables
- [ ] Redeployed Vercel app after adding environment variable
- [ ] Tested with test card
- [ ] Verified payment popup opens correctly

## Going Live

When ready for production:

1. Complete Paystack onboarding process
2. Get verified on Paystack
3. Get live API keys
4. Update `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in Vercel to live key
5. Redeploy
6. Test with real card (small amount first)

## Support

- Paystack Documentation: https://paystack.com/docs
- Paystack Support: support@paystack.com
- API Reference: https://paystack.com/docs/api
