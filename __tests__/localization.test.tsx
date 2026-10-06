import React from 'react';
import {I18nManager, NativeModules, Platform, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import {
  LocalizationProvider,
  useLocalization,
} from '../i18n/LocalizationContext';

const LANGUAGE_KEY = '@ratekunst/language';
const originalPlatform = Platform.OS;
const originalSettings = NativeModules.SettingsManager;
const originalConstants = I18nManager.getConstants;
const getItem = jest.mocked(AsyncStorage.getItem).getMockImplementation()!;
const setItem = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
let tree: renderer.ReactTestRenderer | undefined;
let localization: ReturnType<typeof useLocalization>;
const Probe = () => {
  localization = useLocalization();
  return <Text>{localization.t('startMenu')}</Text>;
};
const mount = async () => {
  await act(async () => {
    tree = renderer.create(
      <LocalizationProvider>
        <Probe />
      </LocalizationProvider>,
    );
  });
};
const deviceLocale = (localeIdentifier: string | undefined) => {
  const read = jest.fn(() => ({
    isRTL: false,
    doLeftAndRightSwapInRTL: true,
    localeIdentifier,
  }));
  I18nManager.getConstants = read;
  return read;
};

beforeEach(async () => {
  Platform.OS = 'android';
  jest.mocked(AsyncStorage.getItem).mockImplementation(getItem);
  jest.mocked(AsyncStorage.setItem).mockImplementation(setItem);
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
  Platform.OS = originalPlatform;
  NativeModules.SettingsManager = originalSettings;
  I18nManager.getConstants = originalConstants;
});

it.each([
  ['de_DE', 'de'],
  ['de-AT', 'de'],
  ['DE-ch', 'de'],
  ['de', 'de'],
  ['en_GB', 'en'],
  ['en-US', 'en'],
  ['fr-FR', 'en'],
  [undefined, 'en'],
])(
  'chooses and persists %s as %s on first Android launch',
  async (locale, expected) => {
    deviceLocale(locale);
    await mount();
    expect(localization.language).toBe(expected);
    expect(tree!.root.findByType(Text).props.children).toBe(
      expected === 'de' ? 'Spiel vorbereiten' : 'Set up game',
    );
    expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe(expected);
  },
);

it('uses the iOS preferred language ahead of its regional locale', async () => {
  Platform.OS = 'ios';
  NativeModules.SettingsManager = {
    getConstants: () => ({
      settings: {AppleLanguages: ['en-DE', 'de-DE'], AppleLocale: 'de_DE'},
    }),
  };
  await mount();
  expect(localization.language).toBe('en');
  expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe('en');
});

it('supports the legacy iOS regional locale when preferred languages are missing', async () => {
  Platform.OS = 'ios';
  NativeModules.SettingsManager = {settings: {AppleLocale: 'de_AT'}};
  await mount();
  expect(localization.language).toBe('de');
});

it('keeps the first-launch choice after the device language changes', async () => {
  const locale = deviceLocale('en_US');
  await mount();
  act(() => tree!.unmount());
  locale.mockReturnValue({
    isRTL: false,
    doLeftAndRightSwapInRTL: true,
    localeIdentifier: 'de_DE',
  });
  await mount();
  expect(localization.language).toBe('en');
  expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe('en');
});

it('preserves a saved manual choice instead of overwriting it with the device language', async () => {
  deviceLocale('en_US');
  await AsyncStorage.setItem(LANGUAGE_KEY, 'de');
  jest.mocked(AsyncStorage.setItem).mockClear();
  await mount();
  expect(localization.language).toBe('de');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('preserves a manual choice while first-launch storage is still loading', async () => {
  deviceLocale('de_DE');
  let resolveRead!: (value: string | null) => void;
  jest.mocked(AsyncStorage.getItem).mockImplementation(
    () =>
      new Promise(resolve => {
        resolveRead = resolve;
      }),
  );
  await mount();
  await act(async () => localization.setLanguage('en'));
  await act(async () => resolveRead(null));
  expect(localization.language).toBe('en');
  expect(jest.mocked(AsyncStorage.setItem).mock.calls).toEqual([
    [LANGUAGE_KEY, 'en'],
  ]);
});

it('serializes the initial default and rapid manual choices so the latest choice wins', async () => {
  deviceLocale('en_US');
  let finishFirstWrite!: () => void;
  const writes = jest.mocked(AsyncStorage.setItem).mockImplementationOnce(
    (key, value) =>
      new Promise<void>(resolve => {
        finishFirstWrite = () => {
          setItem(key, value).then(resolve);
        };
      }),
  );
  await mount();
  act(() => {
    localization.setLanguage('de');
    localization.setLanguage('en');
    localization.setLanguage('de');
  });
  expect(writes.mock.calls).toEqual([[LANGUAGE_KEY, 'en']]);
  await act(async () => {
    finishFirstWrite();
    for (let i = 0; i < 20; i += 1) {
      await Promise.resolve();
    }
  });
  expect(localization.language).toBe('de');
  expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe('de');
});
