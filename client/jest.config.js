module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  verbose: true,
  setupFiles: ['<rootDir>/src/tests/__mocks__/browserMocks.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  testURL: 'http://localhost:8080',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  moduleDirectories: ['node_modules'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/tests/__mocks__/fileMock.ts',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^./style$': 'identity-obj-proxy',
    '^preact$': '<rootDir>/node_modules/preact/dist/preact.min.js',
    '^react$': 'preact/compat',
    '^react-dom$': 'preact/compat',
  },
  collectCoverage: true,
  coverageThreshold: {
    './src/machine/*.ts': {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
}
