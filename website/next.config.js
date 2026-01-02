const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Ensure API routes are treated as serverless functions
  output: undefined, // Let Vercel auto-detect (don't force static export)
  
  // Configure webpack for path resolution
  // CRITICAL: When root directory is 'website', we need to ensure @/ resolves correctly
  webpack: (config, { isServer, dir }) => {
    // dir is the absolute path to the project root (website directory in Vercel)
    const projectRoot = dir || path.resolve(__dirname);
    
    console.log('[webpack] Configuring path resolution:');
    console.log('[webpack] dir parameter:', dir);
    console.log('[webpack] __dirname:', __dirname);
    console.log('[webpack] projectRoot:', projectRoot);
    
    // Set alias for @/ to point to project root
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': projectRoot,
    };
    
    // Ensure modules resolve from project root
    config.resolve.modules = [
      projectRoot,
      path.join(projectRoot, 'node_modules'),
      ...(Array.isArray(config.resolve.modules) ? config.resolve.modules.filter(m => m !== projectRoot) : []),
    ];
    
    // Set roots for module resolution
    config.resolve.roots = [projectRoot];
    
    console.log('[webpack] @ alias set to:', config.resolve.alias['@']);
    console.log('[webpack] resolve.modules:', config.resolve.modules.slice(0, 3));
    
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
