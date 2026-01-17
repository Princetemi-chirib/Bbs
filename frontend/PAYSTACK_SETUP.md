# Paystack Integration Setup

This document explains how to set up Paystack payment integration for the checkout page.

## Getting Your Paystack API Keys

1. **Create a Paystack Account**
   - Go to https://paystack.com/ and sign up for an account
   - Verify your email address

2. **Get Your Public Key**
   - Log in to your Paystack Dashboard: https://dashboard.paystack.com/
   - Navigate to **Settings** → **API Keys & Webhooks**
   - Copy your **Public Key** (starts with `pk_test_` for test mode or `pk_live_` for production)

## Environment Variable Setup

1. Create a `.env.local` file in the `frontend` directory if it doesn't exist:

```bash
cd frontend
touch .env.local
```

2. Add your Paystack public key to `.env.local`:

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_actual_public_key_here
```

**Important Notes:**
- For development/testing, use a test public key (starts with `pk_test_`)
- For production, use a live public key (starts with `pk_live_`)
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser

## Testing Payments

### Test Cards (Test Mode Only)

Paystack provides test cards for testing different payment scenarios:

- **Successful Payment**: `4084084084084081`
- **Insufficient Funds**: `5060666666666666666`
- **Do Not Honor**: `4123456789012346`
- **Insufficient Funds (Alternative)**: `5060666666666666669`

**Test Card Details:**
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- PIN: Any 4 digits (e.g., `0000`)
- OTP: Any 6 digits (e.g., `123456`)

## Production Setup

When deploying to production:

1. Get your live public key from Paystack Dashboard
2. Update the environment variable in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Build & Deploy → Environment
   - Other platforms: Follow their documentation for environment variables

3. Make sure to use `pk_live_...` instead of `pk_test_...`

## Webhook Setup (Optional - for Backend Verification)

If you want to verify payments on the backend:

1. In Paystack Dashboard, go to **Settings** → **API Keys & Webhooks**
2. Add a webhook URL (e.g., `https://yourdomain.com/api/webhooks/paystack`)
3. Implement a webhook endpoint in your backend to verify payment transactions

## Troubleshooting

- **"Invalid public key"**: Check that your public key is correctly set in `.env.local` and starts with `pk_test_` or `pk_live_`
- **"Amount must be at least 100 kobo"**: The minimum amount Paystack accepts is ₦1 (100 kobo). Make sure your cart total is at least ₦1
- **Payment popup doesn't open**: Check browser console for errors. Make sure `react-paystack` is installed and the public key is set

## Resources

- [Paystack Documentation](https://paystack.com/docs)
- [Paystack API Reference](https://paystack.com/docs/api)
- [React Paystack Package](https://www.npmjs.com/package/react-paystack)
