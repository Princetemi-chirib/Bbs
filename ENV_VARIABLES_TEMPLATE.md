# Complete Environment Variables Template for Vercel

Copy and paste these into Vercel Dashboard → Settings → Environment Variables

## Required Variables

### Paystack (Required)
```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
```
**Where to get it:**
- Go to https://dashboard.paystack.com
- Settings → API Keys & Webhooks
- Copy "Test Public Key" (starts with `pk_test_`)

**Example Format:**
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Replace x's with your actual key - usually 60-70 characters long)

### Email Service - Hostinger (Required)
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@bbslimited.online
SMTP_PASS=Bbspasskey@2025
EMAIL_FROM=admin@bbslimited.online
```

### App Configuration (Optional - has defaults)
```env
APP_NAME=Barber Booking System
NODE_ENV=production
```

## Complete Template (Copy All)

```env
# Paystack Public Key (Get from https://dashboard.paystack.com → Settings → API Keys)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here

# Hostinger Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@bbslimited.online
SMTP_PASS=Bbspasskey@2025
EMAIL_FROM=admin@bbslimited.online

# App Settings
APP_NAME=Barber Booking System
NODE_ENV=production
```

## Step-by-Step: Adding to Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com
   - Select your project

2. **Navigate to Environment Variables**
   - Click **Settings** tab
   - Click **Environment Variables** in left sidebar

3. **Add Each Variable**
   - Click **Add New**
   - Enter the **Key** (left column)
   - Enter the **Value** (right column)
   - Select **Environment**: Production, Preview, Development (or all)
   - Click **Save**

4. **Add Variables One by One:**
   ```
   Key: NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
   Value: pk_test_your_actual_key_here
   
   Key: SMTP_HOST
   Value: smtp.hostinger.com
   
   Key: SMTP_PORT
   Value: 465
   
   Key: SMTP_USER
   Value: admin@bbslimited.online
   
   Key: SMTP_PASS
   Value: Bbspasskey@2025
   
   Key: EMAIL_FROM
   Value: admin@bbslimited.online
   
   Key: APP_NAME
   Value: Barber Booking System
   
   Key: NODE_ENV
   Value: production
   ```

5. **Redeploy**
   - After adding all variables, go to **Deployments** tab
   - Click the three dots (⋯) on latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger automatic redeploy

## Quick Copy-Paste Format

If you prefer to add them all at once, here's the format Vercel accepts:

**In Vercel Dashboard, add these one by one:**

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_test_...` (your actual key) | Production, Preview, Development |
| `SMTP_HOST` | `smtp.hostinger.com` | Production, Preview, Development |
| `SMTP_PORT` | `465` | Production, Preview, Development |
| `SMTP_USER` | `admin@bbslimited.online` | Production, Preview, Development |
| `SMTP_PASS` | `Bbspasskey@2025` | Production, Preview, Development |
| `EMAIL_FROM` | `admin@bbslimited.online` | Production, Preview, Development |
| `APP_NAME` | `Barber Booking System` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production, Preview, Development |

## Verification

After deployment, verify your environment variables are working:

1. **Check Paystack**: Open browser console on your site, payment popup should work
2. **Check Email**: Use test email endpoint: `POST /api/v1/emails/test`
3. **Check API**: Visit `https://your-app.vercel.app/api/v1/health`

## Troubleshooting

### Paystack popup not opening?
- ✅ Check `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set correctly
- ✅ Make sure it starts with `pk_test_` or `pk_live_`
- ✅ Redeploy after adding the variable
- ✅ Check browser console for errors

### Emails not sending?
- ✅ Verify all SMTP variables are set
- ✅ Check SMTP credentials are correct
- ✅ Test with `/api/v1/emails/test` endpoint
- ✅ Check Vercel function logs

### Environment variables not loading?
- ✅ Make sure variable name matches exactly (case-sensitive)
- ✅ Redeploy after adding variables
- ✅ Use `NEXT_PUBLIC_` prefix for client-side variables
- ✅ Variables without `NEXT_PUBLIC_` are only available server-side
