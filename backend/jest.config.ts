export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coveragePathIgnorePatterns: [
    'main.ts',
    '<rootDir>/generated/',
    '<rootDir>/scripts/',
    '<rootDir>/health/',
    '.module.ts$',
    '.dto.ts$',
    '.entity.ts$',
    '.guard.ts$',
    '.spec.ts$',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary', 'cobertura'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  setupFiles: ['<rootDir>/../test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@scure|otplib|@otplib|@noble)/)',
  ],
};
