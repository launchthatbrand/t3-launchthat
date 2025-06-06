import baseConfig, { restrictEnvAccess } from "@acme/eslint-config/base";
import nextjsConfig from "@acme/eslint-config/nextjs";
import reactConfig from "@acme/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess, // Apply the general restriction first
  // Override for Convex files to allow process.env
  {
    files: ["convex/**/*.ts"],
    rules: {
      // Disable the rule restricting direct access to process.env for Convex
      "no-restricted-properties": "off",
      // Assuming no-restricted-imports does not block 'process' itself
      // If it does, we might need: "no-restricted-imports": "off"
    },
  },
];
