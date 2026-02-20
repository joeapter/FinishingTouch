import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  transpilePackages: ['@finishing-touch/shared'],
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
