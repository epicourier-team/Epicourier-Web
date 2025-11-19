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
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2021",
          parser: {
            syntax: "typescript",
            tsx: true,
            decorators: true,
          },
          transform: {
            react: {
              runtime: "automatic",
              useBuiltins: true,
            },
          },
        },
      },
    ] as [string, unknown],
  },

  transformIgnorePatterns: [
    "node_modules/(?!(lodash-es|@fullcalendar|lucide-react|@radix-ui|shadcn|react-icons|@supabase|next|@next|react|react-dom)/)",
  ],

  testMatch: ["**/__tests__/jsdom/**/*.[jt]s?(x)"],
  watchPlugins: [],
};

export default createJestConfig(customJestConfig);
