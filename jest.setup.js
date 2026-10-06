const {jest} = require('@jest/globals');

// GH 2.16 wraps UIManager's responder methods, but its supplied Jest mock
// omits these two native methods. Keep lifecycle recovery testable.
jest.mock(
  'react-native-gesture-handler/lib/commonjs/RNGestureHandlerModule',
  () => ({
    __esModule: true,
    default: {
      ...require('react-native-gesture-handler/lib/commonjs/mocks').default,
      handleClearJSResponder: jest.fn(),
      handleSetJSResponder: jest.fn(),
    },
  }),
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Existing UI tests exercise a German device. Locale-specific tests override
// the public I18nManager constants explicitly, including English/unknown cases.
const {NativeModules} = require('react-native');
const i18nConstants = NativeModules.I18nManager.getConstants();
NativeModules.I18nManager.getConstants = () => ({
  ...i18nConstants,
  localeIdentifier: 'de_DE',
});
NativeModules.SettingsManager = {
  getConstants: () => ({
    settings: {AppleLanguages: ['de-DE'], AppleLocale: 'de_DE'},
  }),
};
