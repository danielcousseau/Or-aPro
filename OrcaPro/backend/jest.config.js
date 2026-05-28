module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  setupFiles: ["<rootDir>/__tests__/setup.js"],
  testTimeout: 15000,
  globals: {
    "ts-jest": { tsconfig: { strict: false } },
  },
};
