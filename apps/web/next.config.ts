import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@agentipo/shared'],
  reactStrictMode: true,
  // Docker: `.next/standalone` carries only the traced files, not the whole workspace.
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
