/**
 * Jest configuration.
 *
 * Three projects:
 *  - `unit`     React component tests (jsdom + Testing Library)
 *  - `api`      API-route tests in a node environment, Prisma mocked
 *  - `lib`      pure-function tests for validation, formatting and serialisation
 *
 * `next/jest` wires up the SWC transform and CSS module handling, so no
 * Babel config is needed.
 */
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const baseConfig = {
  ...createJestConfig(),
  // next/jest only enables the JSX parser for .jsx files, and this project keeps
  // JSX in .js (as the report's structure does), so the SWC parser is configured
  // explicitly for .js as well.
  transform: {
    '^.+\\.(js|jsx|mjs)$': [
      'next/dist/build/swc/jest-transformer',
      {
        jsc: {
          parser: { syntax: 'ecmascript', jsx: true },
          transform: { react: { runtime: 'automatic' } },
          target: 'es2022',
        },
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  // Mirrors the `@/*` alias in jsconfig.json. Declared explicitly so the tests
  // resolve the same way regardless of how next/jest reads the jsconfig.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.js',
    'lib/**/*.js',
    'pages/api/**/*.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: { branches: 40, functions: 50, lines: 55, statements: 55 },
  },
};

/** @type {import('jest').Config} */
const unitConfig = {
  ...baseConfig,
  displayName: 'unit',
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
};

/** @type {import('jest').Config} */
const apiConfig = {
  ...baseConfig,
  displayName: 'api',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/api/**/*.test.js'],
};

/** @type {import('jest').Config} */
const libConfig = {
  ...baseConfig,
  displayName: 'lib',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/lib/**/*.test.js'],
};

module.exports = {
  projects: [unitConfig, apiConfig, libConfig],
  coverageReporters: ['text-summary', 'lcov'],
};