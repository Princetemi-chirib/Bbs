# Cloudinary Image Service Setup

This project uses **Cloudinary** as the image upload and optimization service. Cloudinary provides:
- Image optimization and transformation
- Automatic format conversion (WebP, AVIF)
- Responsive image delivery via CDN
- Profile picture management
- Service image storage
- Document uploads (PDFs, CVs)

## Setup Instructions

### 1. Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account (free tier includes 25GB storage, 25GB bandwidth/month)

### 2. Get Your Cloudinary Credentials

1. Log in to your Cloudinary dashboard
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the dashboard

### 3. Add Environment Variables

Add these to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: Logo Public ID (if you upload a logo to Cloudinary)
CLOUDINARY_LOGO_PUBLIC_ID=bbs/logo
```

### 4. Upload Your Logo (Optional)

1. Upload your brand logo to Cloudinary
2. Note the public_id (or set a custom one like `bbs/logo`)
3. Update `CLOUDINARY_LOGO_PUBLIC_ID` in your `.env.local`

Or place your logo at `/public/images/logo.png` as a fallback.

## Usage

### Image Upload Endpoint

**POST** `/api/v1/upload/image`

Upload an image (profile picture, service image, etc.)

**Form Data:**
- `file` (required): The image file
- `folder` (optional): Cloudinary folder path (default: `bbs/images`)
- `type` (optional): Type of upload - `general`, `profile`, or `service`
- `userId` (optional): For profile pictures
- `serviceId` (optional): For service images
- `imageType` (optional): For service images - `before` or `after`

**Example:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('type', 'profile');
formData.append('userId', 'user-123');

const response = await fetch('/api/v1/upload/image', {
  method: 'POST',
  body: formData,
});
const data = await response.json();
console.log(data.data.url); // Cloudinary URL
```

### Document Upload Endpoint

**POST** `/api/v1/upload/document`

Upload a document (PDF, CV, etc.)

**Form Data:**
- `file` (required): The document file
- `folder` (optional): Cloudinary folder path (default: `bbs/documents`)

**Example:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'bbs/applications');

const response = await fetch('/api/v1/upload/document', {
  method: 'POST',
  body: formData,
});
const data = await response.json();
console.log(data.data.url); // Cloudinary URL
```

## Features

### Automatic Image Optimization

All uploaded images are automatically:
- Optimized for web delivery
- Converted to modern formats (WebP, AVIF)
- Served via Cloudinary's global CDN
- Compressed while maintaining quality

### Profile Pictures

Profile pictures are automatically:
- Cropped to 400x400px
- Face-detected and centered
- Optimized for web

### Service Images

Service images (before/after) are:
- Organized by service ID
- Optimized for fast loading
- Delivered via CDN

## Fallback Behavior

If Cloudinary is not configured, the system will:
- Fall back to local file storage (for development)
- Continue working but without optimization/CDN benefits

## Benefits

✅ **Fast Delivery**: Images served via global CDN  
✅ **Automatic Optimization**: Reduces file sizes by 30-50%  
✅ **Responsive Images**: Automatic format conversion  
✅ **Organized Storage**: Images organized in folders  
✅ **Scalable**: Handles millions of images  
✅ **Free Tier**: 25GB storage + 25GB bandwidth/month free  

## Next Steps

1. Set up your Cloudinary account
2. Add credentials to `.env.local`
3. Test image uploads through the admin dashboard
4. Upload your brand logo to Cloudinary
5. Update email templates to use Cloudinary images
