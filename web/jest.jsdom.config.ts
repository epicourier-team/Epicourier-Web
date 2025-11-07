import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  // ✅ 明確指定 transform
  transform: {
    "^.+\\.(t|j)sx?$": "babel-jest",
  },

  // ✅ 讓特定 node_modules 內的 ESM 模組也被 Babel 處理
  transformIgnorePatterns: [
    "node_modules/(?!(lodash-es|@fullcalendar|lucide-react|@radix-ui|shadcn|react-icons|@supabase|next|@next|react|react-dom)/)",
  ],

  // ✅ 匹配 jsdom 測試目錄
  testMatch: ["**/__tests__/jsdom/**/*.[jt]s?(x)"],

  // ✅ 關閉自動 watch plugin（部分環境沒安裝會報錯）
  watchPlugins: [],
};

export default createJestConfig(customJestConfig);
