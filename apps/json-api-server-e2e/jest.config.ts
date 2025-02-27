/* eslint-disable */
export default {
  displayName: 'json-api-server-e2e',
  preset: '../../jest.preset.js',
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  globalTeardown: '<rootDir>/src/support/global-teardown.ts',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  testEnvironment: 'node',
  maxWorkers: 1,
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/json-api-server-e2e',
  moduleNameMapper: {
    '^@klerick/json-api-nestjs$':
      '<rootDir>/../../dist/libs/json-api/json-api-nestjs',
    '^@klerick/json-api-nestjs-microorm$':
      '<rootDir>/../../dist/libs/json-api/json-api-nestjs-microorm',
    '^@klerick/json-api-nestjs-shared$':
      '<rootDir>/../../dist/libs/json-api/json-api-nestjs-shared',
    '^@klerick/json-api-nestjs-typeorm$':
      '<rootDir>/../../dist/libs/json-api/json-api-nestjs-typeorm',
  },
};
