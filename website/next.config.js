const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Ensure API routes are treated as serverless functions
  output: undefined, // Let Vercel auto-detect (don't force static export)
  
  // Explicitly configure webpack to resolve @/ paths
  // When root directory is 'website', __dirname is the website directory
  // This ensures @/ resolves correctly in Vercel builds
  webpack: (config, { isServer, dir }) => {
    // Use dir parameter (Next.js provides this) or fallback to __dirname
    // dir is the absolute path to the project root (website directory)
    const projectRoot = dir || path.resolve(__dirname);
    
    // Set alias for @/ to point to project root (website directory)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': projectRoot,
    };
    
    // Ensure modules resolve from project root
    // This helps webpack find modules when root directory is set
    config.resolve.modules = [
      projectRoot,
      path.join(projectRoot, 'node_modules'),
      ...(Array.isArray(config.resolve.modules) ? config.resolve.modules : []),
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
