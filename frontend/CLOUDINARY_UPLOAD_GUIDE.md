# Cloudinary Image Upload Guide

## ✅ Cloudinary is Fully Configured!

Your Cloudinary account is set up and working for **all image uploads** in the system:

### What Works with Cloudinary:

1. **Service Images (Before/After)** - ✅ Ready
   - Admin can upload service images when creating/editing services
   - Images are stored in Cloudinary folder: `bbs/services/{serviceId}`
   - Location: `/admin/services` page

2. **Barber Profile Pictures** - ✅ Ready
   - Upload endpoint: `/api/v1/upload/image` with `type=profile`
   - Images are stored in Cloudinary folder: `bbs/profiles`
   - Automatically optimized and cropped (400x400 with face detection)

3. **Barber Application Documents** - ✅ Ready
   - CVs and application letters uploaded to Cloudinary
   - Stored in folder: `bbs/applications`
   - Location: `/barber-recruit` page

4. **Company Logo for Emails** - ✅ Ready
   - Upload your logo to Cloudinary and set `CLOUDINARY_LOGO_PUBLIC_ID`
   - See `LOGO_EMAIL_SETUP.md` for instructions

---

## 📤 How to Upload Images

### For Admin - Service Images:

1. Go to `/admin/services`
2. Click "Add Service" or "Edit" on an existing service
3. In the form, you'll see:
   - **File upload button** - Click to select an image file
   - **OR paste a URL** - If you already have an image URL
4. The image will be uploaded to Cloudinary automatically
5. The Cloudinary URL will be saved to the database

### For Barbers - Profile Pictures:

**Option 1: Via API (when barber dashboard is ready)**
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('type', 'profile');
formData.append('userId', barberUserId);

const response = await fetch('/api/v1/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const data = await response.json();
// data.data.url contains the Cloudinary URL
```

**Option 2: Direct upload (future barber profile page)**
- We can add a profile picture upload feature to the barber dashboard
- Same process as service images but with `type=profile`

---

## 🔧 API Endpoints

### Upload Image
**POST** `/api/v1/upload/image`

**Body (FormData):**
- `file` - Image file
- `type` - `'profile'` | `'service'` | `'general'`
- `folder` (optional) - Custom folder
- `userId` (for profile) - User ID
- `serviceId` (for service) - Service ID
- `imageType` (for service) - `'before'` | `'after'`

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "public_id": "bbs/services/123/before",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "bytes": 245678
  }
}
```

### Upload Document (PDF/JPG)
**POST** `/api/v1/upload/document`

**Body (FormData):**
- `file` - PDF or JPG file
- `folder` (optional) - Custom folder

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "public_id": "bbs/applications/barber-app-123456",
    "filename": "cv.pdf",
    "size": 123456,
    "type": "application/pdf"
  }
}
```

---

## 🎨 Image Optimizations

Cloudinary automatically:
- ✅ **Optimizes** image quality (auto quality)
- ✅ **Converts** to WebP format (when supported)
- ✅ **Resizes** images appropriately
- ✅ **Crops** profile pictures (400x400 with face detection)
- ✅ **Compresses** files to reduce size
- ✅ **Serves** via fast CDN

---

## 📁 Cloudinary Folder Structure

```
bbs/
├── profiles/              # Barber profile pictures
│   └── {userId}/
├── services/              # Service images
│   └── {serviceId}/
│       ├── before.jpg
│       └── after.jpg
├── applications/          # CVs and application letters
│   └── barber-app-*.pdf
├── documents/             # Other documents
└── images/                # General images
```

---

## 🚀 Benefits of Cloudinary

1. **Fast CDN** - Images load quickly worldwide
2. **Automatic Optimization** - Smaller file sizes, faster loading
3. **Email-Compatible** - Cloudinary URLs work in emails (unlike localhost)
4. **Image Transformations** - Resize, crop, optimize on-the-fly
5. **Secure** - Images are served over HTTPS
6. **Scalable** - Handles high traffic automatically

---

## 🐛 Troubleshooting

### Images not showing in emails?
- ✅ Use Cloudinary URLs (they work in emails)
- ❌ Don't use localhost URLs (they don't work in emails)

### Upload fails?
- Check that `CLOUDINARY_URL` is set in `.env.local`
- Verify Cloudinary credentials are correct
- Check file size limits (5MB for images, 10MB for documents)

### Want to upload logo to Cloudinary?

1. Go to https://cloudinary.com/console
2. Media Library → Upload
3. Upload your logo
4. Set Public ID to `bbs/logo`
5. Add to `.env.local`:
   ```env
   CLOUDINARY_LOGO_PUBLIC_ID=bbs/logo
   ```

---

## 📝 Current Status

- ✅ Service image uploads (Admin)
- ✅ Document uploads (Barber applications)
- ✅ Profile picture API ready (needs UI in barber dashboard)
- ✅ Logo upload ready (needs manual upload to Cloudinary)
- ✅ All uploads go to Cloudinary automatically
- ✅ Fallback to local storage if Cloudinary not configured

---

## 🔮 Future Enhancements

1. **Barber Profile Page** - Add UI for profile picture uploads
2. **Image Gallery** - Show uploaded images in admin panel
3. **Image Management** - Delete/replace images from Cloudinary
4. **Bulk Upload** - Upload multiple service images at once
