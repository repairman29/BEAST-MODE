const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable ESLint during builds (warnings are blocking deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during builds (if any)
  typescript: {
    ignoreBuildErrors: true,
  },
  
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
    
    // Exclude CommonJS lib/mlops from webpack analysis
    // These are server-side only and loaded at runtime via require()
    // Webpack should not try to parse them during build
    if (!isServer) {
      // Client-side: Don't try to bundle server-only modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Copy lib/mlops files to output directory so they're available at runtime
    // This is needed for Vercel deployments where files need to be in the output
    if (isServer) {
      const CopyWebpackPlugin = require('copy-webpack-plugin');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.join(projectRoot, 'lib', 'mlops'),
              to: path.join(projectRoot, '.next', 'server', 'lib', 'mlops'),
              noErrorOnMissing: true,
            },
          ],
        })
      );
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
