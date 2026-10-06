module.exports = {
  preset: 'react-native',
  setupFiles: ['react-native-gesture-handler/jestSetup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native(-community)?)/|react-native-safe-area-context/|react-native-gesture-handler/)',
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
