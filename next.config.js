/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for audio file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
    }
    return config;
  },
};

module.exports = nextConfig;