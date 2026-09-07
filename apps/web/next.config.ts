import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@agentipo/shared'],
  reactStrictMode: true,
};

export default nextConfig;
