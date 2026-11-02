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
    // Runtime environment files must not be copied into server function bundles.
    outputFileTracingExcludes: {
      "*": ["./.env", "./.env.*", "./**/.env", "./**/.env.*"],
    },
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "bullmq", "ioredis"],
  },
};

module.exports = nextConfig;
