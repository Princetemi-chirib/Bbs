/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Enable optimization for landing page and other remote images (resize, WebP, cache).
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'whitesmoke-jackal-101083.hostingersite.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 'img.icons8.com',
      },
    ],
  },
};

module.exports = nextConfig;
