/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/", "\\.pnp\\.[^/]+$"],
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/convex/"],
  clearMocks: true,
};

