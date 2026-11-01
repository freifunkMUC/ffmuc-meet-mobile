module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@jitsi/react-native-sdk$': '<rootDir>/__mocks__/jitsi-sdk.tsx',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__mocks__/'],
};
