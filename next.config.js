/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.shopify.com",
      },
      {
        protocol: "https",
        hostname: "**.myshopify.com",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "bullmq", "ioredis"],
  },
};

module.exports = nextConfig;
