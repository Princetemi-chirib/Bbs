# Logo Setup for Email Templates

Your logo isn't displaying in emails because email clients require **publicly accessible, absolute HTTPS URLs**. Local files or localhost URLs won't work.

## ✅ Recommended Solution: Upload Logo to Cloudinary

### Step 1: Upload Your Logo to Cloudinary

1. Go to your Cloudinary Dashboard: https://cloudinary.com/console
2. Click **Media Library** → **Upload**
3. Upload your logo file: `WhatsApp Image 2025-07-26 at 20.20.08_a40e3183 - Edited.png`
4. After upload, note the **Public ID** (or set a custom one like `bbs/logo`)

### Step 2: Set Environment Variable

Add to your `.env.local`:

```env
CLOUDINARY_LOGO_PUBLIC_ID=bbs/logo
```

Or if you want to use the actual public ID from Cloudinary:

```env
CLOUDINARY_LOGO_PUBLIC_ID=your-actual-public-id-here
```

### Step 3: Test

Run the test script again:

```bash
npm run test-emails
```

The logo will now display in all emails using Cloudinary's CDN URL: `https://res.cloudinary.com/dqigh6mt2/image/upload/c_limit,q_auto,w_200/bbs/logo.png`

---

## 🔄 Alternative: Use Production Site URL

If your Next.js site is deployed to Vercel or another hosting service:

1. Make sure `NEXT_PUBLIC_BASE_URL` is set to your production URL
2. Ensure the logo is in `/public/images/` folder (it will be accessible at `https://yourdomain.com/images/logo.png`)
3. The email templates will automatically use the production URL

---

## 🚨 Why Localhost Doesn't Work

Email clients (Gmail, Outlook, etc.) **cannot access**:
- `http://localhost:3000/images/logo.png` ❌
- Relative paths like `/images/logo.png` ❌
- Local file paths ❌

They **can only access**:
- `https://res.cloudinary.com/...` ✅
- `https://yourdomain.com/images/logo.png` ✅
- Any publicly accessible HTTPS URL ✅

---

## 📝 Quick Fix Steps

1. **Upload logo to Cloudinary** (fastest solution)
   - Login to Cloudinary
   - Upload your logo
   - Set `CLOUDINARY_LOGO_PUBLIC_ID` in `.env.local`
   - Run `npm run test-emails`

2. **Deploy to production** (if not already deployed)
   - Deploy your Next.js app to Vercel
   - Logo will be accessible at production URL
   - Emails will use production URL automatically

3. **Use WordPress URL** (if logo is on WordPress site)
   - If your logo is hosted on `bbslimited.online` WordPress site
   - Update the `getLogoUrl()` function to use that URL directly

---

## 🎯 Current Status

Your logo file exists at:
- Local: `frontend/public/images/WhatsApp Image 2025-07-26 at 20.20.08_a40e3183 - Edited.png`

To make it work in emails:
- ✅ Upload to Cloudinary (recommended)
- ✅ Deploy site to production
- ✅ Host on CDN
