# Public Assets Folder

This folder contains static assets that are served directly by Next.js.

## Usage

Files in this folder can be referenced directly in your code:

```tsx
// In your React components
<img src="/images/logo.png" alt="Logo" />

// Or using Next.js Image component
import Image from 'next/image'
<Image src="/images/barber-profile.jpg" alt="Barber" width={200} height={200} />
```

## Folder Structure

```
public/
├── images/
│   ├── avatars/        # User avatars
│   ├── barbers/        # Barber profile images
│   ├── services/       # Service images
│   ├── logos/          # Logo files
│   └── placeholders/   # Placeholder images
└── favicon.ico         # Site favicon
```

## Best Practices

1. **Optimize images** before uploading (use tools like TinyPNG, ImageOptim)
2. **Use Next.js Image component** for automatic optimization
3. **Organize by category** in subfolders
4. **Use descriptive names** (e.g., `barber-john-smith.jpg` not `img123.jpg`)
5. **Consider file sizes** - large images will slow down your site

## Image Formats

- Use **WebP** when possible (better compression)
- **PNG** for images with transparency
- **JPG** for photos
- **SVG** for icons and logos
