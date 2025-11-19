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
};

const config = withMicrofrontends(baseConfig, {
  applicationName: "portal-puck-editor",
  debug: process.env.NODE_ENV !== "production",
});

export default config;
