const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Ensure API routes are treated as serverless functions
  output: undefined, // Let Vercel auto-detect (don't force static export)
  
  // Configure webpack for path resolution and module bundling
  // CRITICAL: When root directory is 'website', we need to ensure @/ resolves correctly
  // Also need to bundle lib modules for serverless (Vercel)
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
    
    // For serverless (production), bundle our lib modules instead of externalizing
    if (isServer) {
      // Don't externalize our internal lib modules - bundle them
      config.externals = config.externals || [];
      
      // Filter out our lib modules from externals so they get bundled
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter((external) => {
          if (typeof external === 'string') {
            // Don't externalize our lib modules
            return !external.includes('lib/mlops') && 
                   !external.includes('lib/github') &&
                   !external.includes('lib/scale') &&
                   !external.includes('lib/optimization');
          }
          // Keep function-based externals
          return true;
        });
      }
      
      // Also handle function-based externals
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
        ({ request }, callback) => {
          // Don't externalize our lib modules
          if (request && (
            request.includes('lib/mlops') ||
            request.includes('lib/github') ||
            request.includes('lib/scale') ||
            request.includes('lib/optimization')
          )) {
            return callback(); // Bundle it
          }
          // Use default externalization for other modules
          if (typeof originalExternals === 'function') {
            return originalExternals({ request }, callback);
          }
          callback();
        }
      ];
    }
    
    console.log('[webpack] @ alias set to:', config.resolve.alias['@']);
    console.log('[webpack] resolve.modules:', config.resolve.modules.slice(0, 3));
    console.log('[webpack] Bundling lib modules for serverless:', isServer);
    
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
            value: process.env.NODE_ENV === 'production' 
              ? 'https://beast-mode.dev' 
              : '*', // Allow all in development
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
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

module.exports = nextConfig;
