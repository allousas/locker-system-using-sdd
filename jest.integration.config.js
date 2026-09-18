/**
 * Integration tests against a real Postgres, started by the suite itself (testcontainers).
 * Prerequisites: a running Docker daemon and dbmate on the PATH (`brew install dbmate`).
 *
 * Set DATABASE_URL to run against an already-running Postgres instead (CI service container, or
 * the local `pnpm db:up` one) — globalSetup then starts nothing.
 * @type {import('jest').Config}
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/.*\\.integration\\.test\\.ts$',
  globalSetup: '<rootDir>/test/fixtures/global-setup.ts',
  globalTeardown: '<rootDir>/test/fixtures/global-teardown.ts',
  // Pulling the image on a cold cache takes far longer than a query.
  testTimeout: 60000,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
