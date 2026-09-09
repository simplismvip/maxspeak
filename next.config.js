/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for audio file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  webpack: (config, { dev, isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('better-sqlite3');
      }
    }
    if (dev) {
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**', '**/data/**'],
      };
    }
    return config;
  },
};

module.exports = nextConfig;