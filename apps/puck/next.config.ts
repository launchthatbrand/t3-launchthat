import type { NextConfig } from 'next';
import { withMicrofrontends } from '@vercel/microfrontends/next/config';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withMicrofrontends(nextConfig, { debug: true });

