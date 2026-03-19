/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['qrcode'],
  },
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
