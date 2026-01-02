const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Ensure API routes are treated as serverless functions
  output: undefined, // Let Vercel auto-detect (don't force static export)
  
  // Configure both webpack (for server) and SWC (for client) path resolution
  webpack: (config, { isServer, dir }) => {
    // Use dir parameter which Next.js provides - this is the website directory
    const projectRoot = dir || path.resolve(__dirname);
    
    // Set alias for @/ to point to project root
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': projectRoot,
    };
    
    // CRITICAL: Ensure modules resolve from project root
    // This is needed when root directory is set to a subdirectory in Vercel
    config.resolve.modules = [
      projectRoot, // Add project root first so relative paths resolve correctly
      path.join(projectRoot, 'node_modules'),
      ...(Array.isArray(config.resolve.modules) ? config.resolve.modules.filter(m => m !== projectRoot) : []),
    ];
    
    // Also ensure that relative paths resolve from the file's directory
    // This helps with ../../lib/ style imports
    config.resolve.roots = [projectRoot];
    
    return config;
  },
  
  // Experimental: Try to ensure SWC also respects paths
  experimental: {
    optimizeCss: true,
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
