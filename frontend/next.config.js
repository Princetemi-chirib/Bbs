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
    ],
  },
};

module.exports = nextConfig;
