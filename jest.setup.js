const {jest} = require('@jest/globals');
global.IS_REACT_ACT_ENVIRONMENT = true;
jest.unmock('react-native/Libraries/Utilities/useColorScheme');
// React 19's renderer exposes the inner type of React.memo components.
// Keep Pressable's real implementation while making existing interaction tests address it.
jest.mock('react-native/Libraries/Components/Pressable/Pressable', () => {
  const actual = jest.requireActual(
    'react-native/Libraries/Components/Pressable/Pressable',
  );
  return {...actual, default: actual.default.type};
});
require('react-native').AppState.currentState = 'active';

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
