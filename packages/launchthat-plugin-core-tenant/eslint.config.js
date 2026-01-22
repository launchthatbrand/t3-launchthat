import baseConfig from "@acme/eslint-config/base";

/** @type {import("eslint").Linter.Config} */
export default [
  ...baseConfig,
  {
    ignores: ["dist/**", ".cache/**", "src/convex/component/_generated/**"],
  },
];

