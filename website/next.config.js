const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Allow imports from parent directory (lib folder)
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@lib': path.resolve(__dirname, '../lib'),
    };
    return config;
  },
  
  // Transpile packages from parent directory
  transpilePackages: [],
  
  // Image optimization
  images: {
    domains: ['github.com', 'avatars.githubusercontent.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers for caching and CDN
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

  // Experimental features for performance
  // Note: optimizeCss requires 'critters' package - disabled for now
  // experimental: {
  //   optimizeCss: true,
  // },
  
  // Performance optimizations
  reactStrictMode: true,
  
  // Compiler optimizations
  swcMinify: true,
};

module.exports = nextConfig;
