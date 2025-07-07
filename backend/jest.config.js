const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

module.exports = {
  preset: 'ts-jest',
  testEnvironment: "node",
  transform: tsJestTransformCfg,
  moduleNameMapper: {
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@validation/(.*)$': '<rootDir>/src/validation/$1'
  }
};