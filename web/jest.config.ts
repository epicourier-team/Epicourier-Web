import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',   // path to your Next app
})

/**  Custom overrides for the test env  */
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(next|react|react-dom)/)',
  ],
}

/**  Export an async config that Next transforms for Jest  */
export default createJestConfig(customJestConfig)
