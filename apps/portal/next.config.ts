import type { NextConfig } from "next";
import { withMicrofrontends } from "@vercel/microfrontends/next/config";
import { withVercelToolbar } from "@vercel/toolbar/plugins/next";

const nextConfig: NextConfig = {
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@acme/api",
    "@acme/auth",
    "@acme/db",
    "@acme/ui",
    "@acme/validators",
    "@acme/puck-config",
  ],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
};

export default withMicrofrontends(nextConfig, { debug: true });

// import createJiti from "jiti";
// import { fileURLToPath } from "url";

// // Import env files to validate at build time. Use jiti so we can load .ts files in here.
// createJiti(fileURLToPath(import.meta.url))("./src/env");

// /** @type {import("next").NextConfig} */
// const config = {
/** Enables hot reloading for local packages without a build step */
// transpilePackages: [
//   "@acme/api",
//   "@acme/auth",
//   "@acme/db",
//   "@acme/ui",
//   "@acme/validators",
// ],

// /** We already do linting and typechecking as separate tasks in CI */
// eslint: { ignoreDuringBuilds: true },
// typescript: { ignoreBuildErrors: true },
// images: {
//   remotePatterns: [
//     {
//       protocol: "https",
//       hostname: "*",
//     },
//   ],
// },

// allowedDevOrigins: [
//   "localhost:3004",
//   "127.0.0.1:3004",
//   "*.localhost:3004",
//   "*.localhost",
//   "*.127.0.0.1:3004",
//   "launchthat.local:3004",
//   "*.launchthat.local:3004",
//   "*.launchthat.local:3000",
//   "launchthat.local:3000",
//   "*.launchthat.local",
//   "launchthat.local",
// ],

//   // Add headers configuration to allow iframe embedding
//   async headers() {
//     return [
//       {
//         source: "/(.*)",
//         headers: [
//           {
//             key: "Content-Security-Policy",
//             value: "frame-ancestors 'self' *;",
//           },
//           {
//             key: "X-Frame-Options",
//             value: "ALLOWALL",
//           },
//         ],
//       },
//     ];
//   },
// };

// export default config;

// import createJiti from "jiti";
// import { fileURLToPath } from "url";
// import { withMicrofrontends } from "@vercel/microfrontends/next/config";
// import { withVercelToolbar } from "@vercel/toolbar/plugins/next";

// // Import env files to validate at build time. Use jiti so we can load .ts files in here.
// createJiti(fileURLToPath(import.meta.url))("./src/env");

// /** @type {import("next").NextConfig} */
// const baseConfig = {
//   /** Enables hot reloading for local packages without a build step */
//   transpilePackages: [
//     "@acme/api",
//     "@acme/auth",
//     "@acme/db",
//     "@acme/ui",
//     "@acme/validators",
//   ],

//   /** We already do linting and typechecking as separate tasks in CI */
//   eslint: { ignoreDuringBuilds: true },
//   typescript: { ignoreBuildErrors: true },
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "*",
//       },
//     ],
//   },

//   allowedDevOrigins: [
//     "localhost:3004",
//     "127.0.0.1:3004",
//     "*.localhost:3004",
//     "*.localhost",
//     "*.127.0.0.1:3004",
//     "launchthat.local:3004",
//     "*.launchthat.local:3004",
//     "*.launchthat.local:3000",
//     "launchthat.local:3000",
//     "*.launchthat.local",
//     "launchthat.local",
//   ],

//   // Add headers configuration to allow iframe embedding
//   async headers() {
//     return [
//       {
//         source: "/(.*)",
//         headers: [
//           {
//             key: "Content-Security-Policy",
//             value: "frame-ancestors 'self' *;",
//           },
//           {
//             key: "X-Frame-Options",
//             value: "ALLOWALL",
//           },
//         ],
//       },
//     ];
//   },
// };

// const config = withMicrofrontends(baseConfig, {
//   appName: "portal-admin",
//   debug: process.env.NODE_ENV !== "production",
// });

// export default withVercelToolbar()(config);
