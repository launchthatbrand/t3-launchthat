import createJiti from "jiti";
import { fileURLToPath } from "url";
import { withMicrofrontends } from "@vercel/microfrontends/next/config";

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
createJiti(fileURLToPath(import.meta.url))("./src/env");

/** @type {import("next").NextConfig} */
const baseConfig = {
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: ["@acme/auth", "@acme/db", "@acme/ui", "@acme/validators"],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
  allowedDevOrigins: [
    "localhost:3004",
    "127.0.0.1:3004",
    "desmond-tatilian.localhost",
    "*.localhost:3004",
    "*.localhost",
    "*.localhost:3000",
    "*.localhost:3001",
    "*.localhost:3024",
    "*.127.0.0.1:3004",
    "launchthat.local:3004",
    "*.launchthat.local:3004",
    "*.launchthat.local:3000",
    "launchthat.local:3000",
    "*.launchthat.local",
    "launchthat.local",
  ],
};

const config = withMicrofrontends(baseConfig, {
  debug: process.env.NODE_ENV !== "production",
});

export default config;
