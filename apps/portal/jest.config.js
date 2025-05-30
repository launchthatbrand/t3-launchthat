/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // We will create this file next
  moduleNameMapper: {
    // Handle CSS imports (e.g., CSS modules)
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    // Handle image imports
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/__mocks__/fileMock.js", // Need to create this mock
    // Handle module path aliases (if you have them in tsconfig.json)
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    // Use ts-jest to transform TypeScript files
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json", // Use the tsconfig in the wsa app directory
      },
    ],
  },
  // Ignore transforms for node_modules, except for specific ES modules if needed
  transformIgnorePatterns: ["/node_modules/", "\\.pnp\\.[^/]+$"],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
};
