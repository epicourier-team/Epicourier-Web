import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./", // path to your Next app
});

/**  Custom overrides for the test env  */
const customJestConfig = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/lib/supabaseClient$": "<rootDir>/__mocks__/@/lib/supabaseClient.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/jest.env.setup.js"],
  transformIgnorePatterns: ["node_modules/(?!(next|react|react-dom)/)"],
  testMatch: ["**/__tests__/node/**/*.[jt]s?(x)"],
};

/**  Export an async config that Next transforms for Jest  */
export default createJestConfig(customJestConfig);
