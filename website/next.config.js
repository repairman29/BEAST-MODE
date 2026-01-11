/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude non-code files from features directory
    config.module.rules.push({
      test: /components\/ide\/features\/(README|test-results|generation-progress|\.json|\.md)/,
      use: 'ignore-loader',
    });

    return config;
  },
};

module.exports = nextConfig;
