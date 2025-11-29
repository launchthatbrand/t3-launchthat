import type { NextConfig } from "next";
import { withMicrofrontends } from "@vercel/microfrontends/next/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["http://*.localhost:*", "desmond-tatilian.localhost"],
  turbopack: {},
};

export default withMicrofrontends(nextConfig, { debug: true });
