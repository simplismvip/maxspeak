/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for audio file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};

module.exports = nextConfig;