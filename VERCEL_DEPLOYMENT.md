# Vercel Deployment Guide

This guide will help you deploy the Barber Booking System to Vercel.

## Project Structure

This is a monorepo with:
- **Frontend**: Next.js app (deploy to Vercel)
- **Backend**: Node.js/Express API (deploy separately - see backend deployment section)

## Frontend Deployment (Vercel)

### Step 1: Connect Repository to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository: `Princetemi-chirib/Bbs`
4. Vercel will auto-detect Next.js

### Step 2: Configure Project Settings

**Root Directory**: Set to `frontend`
- Click **"Edit"** next to Root Directory
- Enter: `frontend`

**Build Settings**:
- Framework Preset: Next.js
- Build Command: `npm run build` (or leave default)
- Output Directory: `.next` (auto-detected)
- Install Command: `npm install`

### Step 3: Environment Variables

Add these environment variables in Vercel Dashboard:

1. **Paystack Public Key**:
   - Key: `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - Value: Your Paystack public key (e.g., `pk_test_...` or `pk_live_...`)

2. **API URL** (if backend is deployed separately):
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: Your backend API URL (e.g., `https://your-backend.railway.app/api/v1`)

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Your site will be live at: `https://your-project.vercel.app`

## Backend Deployment Options

Since Vercel is optimized for serverless functions, you have a few options for the backend:

### Option 1: Railway (Recommended)

1. Go to [Railway](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Set Root Directory to `backend`
5. Add environment variables (from `backend/.env`)
6. Railway will auto-detect Node.js and deploy

### Option 2: Render

1. Go to [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set Root Directory to `backend`
5. Build Command: `npm run build`
6. Start Command: `npm start`
7. Add environment variables

### Option 3: Vercel Serverless Functions (Advanced)

You can convert the backend API routes to Vercel serverless functions, but this requires refactoring.

## Environment Variables Checklist

### Frontend (Vercel)
- ✅ `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- ✅ `NEXT_PUBLIC_API_URL` (backend URL)

### Backend (Railway/Render/etc)
- ✅ `DATABASE_URL` (Neon PostgreSQL)
- ✅ `JWT_SECRET`
- ✅ `JWT_REFRESH_SECRET`
- ✅ `SMTP_HOST` (smtp.hostinger.com)
- ✅ `SMTP_PORT` (465)
- ✅ `SMTP_USER` (admin@bbslimited.online)
- ✅ `SMTP_PASS` (Bbspasskey@2025)
- ✅ `EMAIL_FROM` (admin@bbslimited.online)
- ✅ `FRONTEND_URL` (your Vercel deployment URL)
- ✅ `NODE_ENV` (production)

## Post-Deployment

1. **Update CORS**: Make sure `FRONTEND_URL` in backend matches your Vercel URL
2. **Test Payments**: Use Paystack test mode initially
3. **Test Emails**: Send a test email to verify Hostinger SMTP
4. **Update Paystack Webhooks** (if needed): Point to your backend URL

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project settings
2. Navigate to **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

## Monitoring

- Vercel provides analytics and monitoring in the dashboard
- Check deployment logs if issues occur
- Monitor backend logs on Railway/Render dashboard

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `package.json` scripts are correct

### API Calls Fail
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend
- Verify backend is running and accessible

### Emails Not Sending
- Check backend logs for SMTP errors
- Verify Hostinger credentials are correct
- Ensure `EMAIL_FROM` matches SMTP_USER

## Quick Deploy Commands

If you have Vercel CLI installed:

```bash
cd frontend
vercel
```

Or link to existing project:
```bash
cd frontend
vercel link
vercel deploy --prod
```
