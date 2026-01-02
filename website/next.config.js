const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  
  // Ensure API routes are treated as serverless functions
  output: undefined, // Let Vercel auto-detect (don't force static export)
  
  // Webpack configuration for path aliases
  webpack: (config, { isServer }) => {
    // Ensure @/ alias resolves correctly in both server and client builds
    const alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    config.resolve.alias = alias;
    
    // Also ensure modules resolve correctly
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      ...(config.resolve.modules || []),
    ];
    
    return config;
  },
  
  // API configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },


  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
