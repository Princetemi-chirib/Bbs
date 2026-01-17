# Deploy Full Stack on Vercel

This guide shows you how to deploy both frontend and backend on Vercel using serverless functions.

## Architecture

- **Frontend**: Next.js app (deployed as static/server-side rendered pages)
- **Backend API**: Next.js API routes (deployed as Vercel serverless functions)
- All on the same domain: `https://your-app.vercel.app`

## Advantages

✅ Single deployment  
✅ Same domain for frontend and API  
✅ No CORS issues  
✅ Simplified environment variables  
✅ Free tier available  

## Deployment Steps

### Step 1: Install Backend Dependencies in Frontend

The frontend `package.json` already includes backend dependencies (nodemailer, etc.). If not, run:

```bash
cd frontend
npm install nodemailer @types/nodemailer dotenv
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import repository: `Princetemi-chirib/Bbs`

### Step 3: Configure Project Settings

**Root Directory**: `frontend`

**Build Settings** (auto-detected):
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Step 4: Add Environment Variables

Go to **Settings** → **Environment Variables** and add:

#### Required Variables:
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_... or pk_live_...
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@bbslimited.online
SMTP_PASS=Bbspasskey@2025
EMAIL_FROM=admin@bbslimited.online
APP_NAME=Barber Booking System
NODE_ENV=production
```

#### Optional (if using database):
```
DATABASE_URL=your_neon_database_url
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Your site will be live at: `https://your-project.vercel.app`

## API Endpoints

Your backend API is now available at:
- Health: `https://your-project.vercel.app/api/v1/health`
- Test Email: `POST https://your-project.vercel.app/api/v1/emails/test`
- Order Confirmation: `POST https://your-project.vercel.app/api/v1/emails/order-confirmation`

## Important: Update API Client

The frontend API client is already configured to use relative paths (`/api/v1`), so it will automatically work on the same domain.

**No need to set `NEXT_PUBLIC_API_URL`** - the frontend will use the same domain!

## Testing After Deployment

1. **Test Health Endpoint**:
   ```bash
   curl https://your-project.vercel.app/api/v1/health
   ```

2. **Test Email**:
   ```bash
   curl -X POST https://your-project.vercel.app/api/v1/emails/test \
     -H "Content-Type: application/json" \
     -d '{"to": "your-email@example.com"}'
   ```

3. **Test Frontend**:
   - Visit: `https://your-project.vercel.app`
   - Try adding items to cart
   - Complete checkout flow

## File Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── v1/                    # Backend API routes
│   │       ├── health/
│   │       └── emails/
│   ├── book/                      # Frontend pages
│   ├── cart/
│   └── checkout/
├── lib/
│   ├── server/                    # Server-side utilities
│   │   ├── emailService.ts
│   │   └── emailTemplates.ts
│   └── api.ts                     # Frontend API client
└── vercel.json                    # Vercel config
```

## Serverless Function Limits

Vercel serverless functions have:
- **Timeout**: 10s (Hobby), 60s (Pro) - can extend to 300s
- **Memory**: 1024 MB
- **Cold starts**: Functions may have cold starts (~1-2s)

For email sending, this should be sufficient as emails send quickly.

## Troubleshooting

### Functions timeout?
- Check Vercel plan limits
- Optimize email sending code
- Consider upgrading to Pro plan for longer timeouts

### Environment variables not working?
- Make sure they're set in Vercel dashboard
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Email not sending?
- Verify SMTP credentials in Vercel environment variables
- Check function logs in Vercel dashboard
- Test with the `/api/v1/emails/test` endpoint

## Benefits of This Setup

1. ✅ **No separate backend deployment needed**
2. ✅ **Simplified architecture** - everything in one repo
3. ✅ **No CORS configuration needed**
4. ✅ **Automatic scaling** - Vercel handles it
5. ✅ **Easy deployments** - Git push = auto deploy

## Next Steps

After deployment:
1. Test all functionality
2. Update Paystack webhooks (if using) to point to your Vercel URL
3. Monitor function logs in Vercel dashboard
4. Set up custom domain (optional)
