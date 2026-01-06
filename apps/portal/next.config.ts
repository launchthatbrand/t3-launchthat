import { withMicrofrontends } from "@vercel/microfrontends/next/config";
import { withVercelToolbar } from "@vercel/toolbar/plugins/next";

const resolveClerkSharedFromNextjs = (): {
  nextjs: string;
  shared: string;
  sharedReact: string;
  clerkReact: string;
} => {
  const path = require("path") as typeof import("path");

  const nextjs = require.resolve("@clerk/nextjs");
  const marker = `${path.sep}node_modules${path.sep}@clerk${path.sep}nextjs${path.sep}`;
  const idx = nextjs.lastIndexOf(marker);
  const nextjsPkgRoot =
    idx >= 0 ? nextjs.slice(0, idx + marker.length - 1) : path.dirname(nextjs);

  // IMPORTANT: @clerk/nextjs can end up with a different @clerk/shared instance than the hoisted one.
  // This causes `useClerk()` to throw “can only be used within <ClerkProvider />” even when wrapped.
  const shared = require.resolve("@clerk/shared", { paths: [nextjsPkgRoot] });
  const sharedReact = require.resolve("@clerk/shared/react", {
    paths: [nextjsPkgRoot],
  });
  const clerkReact = require.resolve("@clerk/clerk-react", {
    paths: [nextjsPkgRoot],
  });

  return { nextjs, shared, sharedReact, clerkReact };
};

const clerkResolved = resolveClerkSharedFromNextjs();

const nextConfig = {
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@acme/api",
    "@acme/auth",
    "@acme/db",
    "@acme/ui",
    "@acme/validators",
    "@acme/puck-config",
    "launchthat-plugin-calendar",
    "launchthat-plugin-cms",
    "launchthat-plugin-core",
    "launchthat-plugin-ecommerce",
    "launchthat-plugin-disclaimers",
    "launchthat-plugin-helpdesk",
    "launchthat-plugin-support",
    "launchthat-plugin-tasks",
    "launchthat-plugin-vimeo",
    "launchthat-plugin-lms",
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
  allowedDevOrigins: ["http://*.localhost:*", "desmond-tatilian.localhost"],
  // `experimental.turbo` isn't in the public NextConfig typings yet.
  // We still configure it for Turbopack so workspace packages resolve to a single Clerk instance.
  experimental: {
    turbo: {
      resolveAlias: {
        "zod/v3": "zod",
        // Ensure a single Clerk module instance across workspace packages (prevents Provider/context mismatch).
        "@clerk/nextjs": clerkResolved.nextjs,
        "@clerk/shared": clerkResolved.shared,
        "@clerk/shared/react": clerkResolved.sharedReact,
        "@clerk/clerk-react": clerkResolved.clerkReact,
      },
    },
  } as unknown as any,
  webpack: (config: any) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = config.resolve.alias ?? {};
    config.resolve.alias["zod/v3"] = require.resolve("zod");
    // Ensure a single Clerk module instance across workspace packages (prevents Provider/context mismatch).
    config.resolve.alias["@clerk/nextjs"] = clerkResolved.nextjs;
    config.resolve.alias["@clerk/shared"] = clerkResolved.shared;
    config.resolve.alias["@clerk/shared/react"] = clerkResolved.sharedReact;
    config.resolve.alias["@clerk/clerk-react"] = clerkResolved.clerkReact;
    return config;
  },
} as any;

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
