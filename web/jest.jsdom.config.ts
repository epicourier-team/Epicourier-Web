import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/lib/supabaseClient$": "<rootDir>/__mocks__/@/lib/supabaseClient.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
  setupFiles: ["<rootDir>/jest.env.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!(lodash-es|@fullcalendar|lucide-react|@radix-ui|shadcn|react-icons|@supabase|next|@next|react|react-dom)/)",
  ],

  testMatch: ["**/__tests__/jsdom/**/*.[jt]s?(x)"],
};

export default createJestConfig(customJestConfig);
