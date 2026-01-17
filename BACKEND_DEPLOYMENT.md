# Backend Deployment Guide

This guide shows you how to deploy the backend API to get your `NEXT_PUBLIC_API_URL`.

## Option 1: Railway (Recommended - Easiest)

### Step 1: Sign up for Railway
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign in with GitHub

### Step 2: Deploy from GitHub
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `Princetemi-chirib/Bbs`
4. Railway will auto-detect it's a Node.js project

### Step 3: Configure Settings
1. Click on your service
2. Go to **Settings** tab
3. Set **Root Directory** to: `backend`
4. Set **Start Command** to: `npm start`
5. Set **Build Command** to: `npm run build`

### Step 4: Add Environment Variables
Go to **Variables** tab and add:

```
DATABASE_URL=postgresql://neondb_owner:npg_Y1pNktQZ3lFc@ep-silent-mode-ahavu4vb-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=0a16dc076cbd5702c995f992947e0b03dc7cfd7f274a3336da4ac59508dda7fc
JWT_REFRESH_SECRET=cc03287aa31000ab68fd62b722d7b409ba73d4f6ef2a4a3291cc8d74e875d7fe
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-vercel-app.vercel.app
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@bbslimited.online
SMTP_PASS=Bbspasskey@2025
EMAIL_FROM=admin@bbslimited.online
APP_NAME=Barber Booking System
APP_URL=https://your-vercel-app.vercel.app
```

**Note**: Replace `your-vercel-app.vercel.app` with your actual Vercel URL after deploying the frontend.

### Step 5: Get Your Backend URL
1. Once deployed, Railway will generate a URL
2. Go to **Settings** → **Networking**
3. Click **Generate Domain** (or use the provided one)
4. Your backend URL will look like: `https://your-project-name.up.railway.app`
5. **Your API URL is**: `https://your-project-name.up.railway.app/api/v1`

### Step 6: Update Vercel Frontend
1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add/Update: `NEXT_PUBLIC_API_URL` = `https://your-project-name.up.railway.app/api/v1`
4. Redeploy your frontend

---

## Option 2: Render

### Step 1: Sign up
1. Go to https://render.com
2. Sign up/Sign in with GitHub

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `Princetemi-chirib/Bbs`
3. Click "Connect"

### Step 3: Configure Service
- **Name**: bbs-backend (or any name)
- **Root Directory**: `backend`
- **Environment**: Node
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### Step 4: Add Environment Variables
Click "Advanced" → "Add Environment Variable" and add all the variables from above.

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment
3. Render will provide a URL like: `https://bbs-backend.onrender.com`
4. **Your API URL is**: `https://bbs-backend.onrender.com/api/v1`

### Step 6: Update Vercel
Add `NEXT_PUBLIC_API_URL` to Vercel environment variables with the Render URL.

---

## Option 3: Fly.io

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Login: `fly auth login`
3. In the `backend` directory: `fly launch`
4. Follow prompts
5. Get your URL from dashboard
6. API URL will be: `https://your-app.fly.dev/api/v1`

---

## Testing Your Backend

Once deployed, test your backend:

```bash
# Health check
curl https://your-backend-url.com/health

# Should return:
{
  "status": "ok",
  "timestamp": "...",
  "environment": "production"
}
```

## Important Notes

1. **CORS**: Make sure `FRONTEND_URL` in backend matches your Vercel URL exactly
2. **SSL**: Both Railway and Render provide HTTPS by default
3. **Free Tier**: Both services have free tiers, but may sleep after inactivity (Render)
4. **Database**: Your Neon database URL is already set, no additional setup needed

## Deployment Order

1. ✅ Deploy backend first (Railway/Render)
2. ✅ Get backend URL: `https://your-backend.com/api/v1`
3. ✅ Deploy frontend on Vercel
4. ✅ Add `NEXT_PUBLIC_API_URL` to Vercel environment variables
5. ✅ Update `FRONTEND_URL` in backend to match Vercel URL
6. ✅ Test the connection

## Troubleshooting

### Backend not responding?
- Check logs in Railway/Render dashboard
- Verify environment variables are set
- Ensure `PORT` is set correctly

### CORS errors?
- Verify `FRONTEND_URL` in backend matches your Vercel URL exactly (including https://)
- Check backend logs for CORS errors

### Database connection issues?
- Verify `DATABASE_URL` is correct
- Check Neon dashboard to ensure database is active
