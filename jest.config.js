module.exports = {
  preset: 'react-native',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/setupTests.ts'],

  // Transform patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@maplibre)/)',
  ],

  // Module name mapper for assets and styles
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__tests__/mocks/fileMock.js',
    '^@env$': '<rootDir>/__tests__/mocks/envMock.js',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
    '!src/**/types.ts',
    '!src/navigation/types.ts',
  ],

  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 60,
      statements: 60,
    },
  },

  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/__tests__/**/*.spec.{ts,tsx}',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/setup/',
    '/__tests__/mocks/',
    '/__tests__/utils/',
  ],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Timeout for tests
  testTimeout: 10000,
};
