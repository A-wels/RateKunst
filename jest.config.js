module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native(-community)?)/|react-native-safe-area-context/)',
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
