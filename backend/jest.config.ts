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
    '.module.ts$',
    '.dto.ts$',
    '.entity.ts$',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  setupFiles: ['<rootDir>/../test/setup.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid)/)',
  ],
};
