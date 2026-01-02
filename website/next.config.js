const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Ensure API routes are treated as serverless functions
  output: undefined, // Let Vercel auto-detect (don't force static export)
  
  // Explicitly configure webpack to resolve @/ paths
  // This is needed when root directory is set to a subdirectory in Vercel
  // Next.js 14 uses SWC but still needs webpack for module resolution
  webpack: (config, { isServer }) => {
    const projectRoot = path.resolve(__dirname);
    
    // Set alias for @/ to point to project root
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': projectRoot,
    };
    
    // Ensure modules resolve from project root
    config.resolve.modules = [
      projectRoot,
      path.join(projectRoot, 'node_modules'),
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
