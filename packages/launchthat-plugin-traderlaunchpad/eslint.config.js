import baseConfig from "@acme/eslint-config/base.js";

/** @type {import("eslint").Linter.Config} */
export default [
  ...baseConfig,
  {
    ignores: ["dist/**", ".cache/**"],
  },
];
