/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Mitigation: disable Next.js Image Optimizer (reduces DoS surface)
    // Many pages already pass `unoptimized` per-image; this makes it consistent.
    unoptimized: true,
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
