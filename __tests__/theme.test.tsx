import React from 'react';
import {Appearance, Pressable, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import App from '../App';
import {ThemeProvider, THEME_KEY, useTheme} from '../theme/ThemeContext';
import {darkColors, lightColors} from '../constants/theme';
import SettingsScreen from '../pages/screens/SettingsScreen';
import StartScreen from '../pages/screens/StartScreen';

const originalGetItem = jest
  .mocked(AsyncStorage.getItem)
  .getMockImplementation()!;

let tree: renderer.ReactTestRenderer | undefined;
let systemScheme: 'light' | 'dark' | null;
let listeners: Set<() => void>;
let theme: ReturnType<typeof useTheme>;
const Probe = () => {
  theme = useTheme();
  return null;
};

beforeEach(async () => {
  jest.mocked(AsyncStorage.getItem).mockImplementation(originalGetItem);
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@ratekunst/tutorial-seen', '1');
  systemScheme = 'light';
  listeners = new Set();
  jest
    .spyOn(Appearance, 'getColorScheme')
    .mockImplementation(() => systemScheme);
  jest.spyOn(Appearance, 'addChangeListener').mockImplementation(listener => {
    const notify = () => listener({colorScheme: systemScheme});
    listeners.add(notify);
    return {remove: () => listeners.delete(notify)};
  });
  jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
});

afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
  jest.mocked(Appearance.getColorScheme).mockRestore();
  jest.mocked(Appearance.addChangeListener).mockRestore();
  jest.mocked(Appearance.setColorScheme).mockRestore();
});

const emitScheme = (scheme: typeof systemScheme) =>
  act(() => {
    systemScheme = scheme;
    [...listeners].forEach(listener => listener());
  });

const mountProbe = async () => {
  await act(async () => {
    tree = renderer.create(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
  });
};

it('follows the system by default and persists manual overrides', async () => {
  await mountProbe();
  expect(theme.preference).toBe('system');
  emitScheme('dark');
  expect(theme.mode).toBe('dark');
  await act(async () => theme.setPreference('dark'));
  emitScheme('light');
  expect(theme.mode).toBe('dark');
  expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('dark');
  expect(await AsyncStorage.getItem(THEME_KEY)).toBe('dark');
  act(() => tree!.unmount());
  await mountProbe();
  expect(theme.preference).toBe('dark');
  await act(async () => theme.setPreference('light'));
  emitScheme('dark');
  expect(theme.mode).toBe('light');
  await act(async () => theme.setPreference('system'));
  expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('unspecified');
  expect(theme.mode).toBe('dark');
  emitScheme('light');
  expect(theme.mode).toBe('light');
});

it('does not overwrite a user choice with a late storage read and serializes rapid writes', async () => {
  let resolveRead!: (value: string) => void;
  jest.mocked(AsyncStorage.getItem).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveRead = resolve;
      }),
  );
  await mountProbe();
  await act(async () => {
    theme.setPreference('dark');
    theme.setPreference('light');
    theme.setPreference('system');
    resolveRead('dark');
  });
  expect(theme.preference).toBe('system');
  expect(await AsyncStorage.getItem(THEME_KEY)).toBe('system');
});

it('opens settings, switches themes and language, and retains the game setup', async () => {
  await act(async () => {
    tree = renderer.create(<App />);
  });
  const press = async (label: string) => {
    const control = tree!.root
      .findAllByType(Pressable)
      .find(node => node.props.accessibilityLabel === label);
    expect(control).toBeDefined();
    await act(async () => control!.props.onPress());
  };
  let home = tree!.root.findByType(StartScreen);
  await act(async () =>
    home.findAllByType(TextInput)[0].props.onChangeText('Alex'),
  );
  await press('Spieler hinzufügen');
  await press('Einstellungen');
  const settings = tree!.root.findByType(SettingsScreen);
  const radios = () =>
    settings
      .findAllByType(Pressable)
      .filter(node => node.props.accessibilityRole === 'radio');
  expect(
    radios().find(node => node.props.accessibilityLabel === 'System')!.props
      .accessibilityState.checked,
  ).toBe(true);
  await press('Dunkel');
  expect(
    radios().find(node => node.props.accessibilityLabel === 'Dunkel')!.props
      .accessibilityState.checked,
  ).toBe(true);
  expect(await AsyncStorage.getItem(THEME_KEY)).toBe('dark');
  await press('English');
  expect(radios().some(node => node.props.accessibilityLabel === 'Dark')).toBe(
    true,
  );
  await act(async () => settings.props.navigation.goBack());
  home = tree!.root.findByType(StartScreen);
  expect(
    home.findAllByType(Text).some(node => node.props.children === 'Alex'),
  ).toBe(true);
});

// Readability is part of the theme contract: normal text needs at least 4.5:1.
const luminance = (hex: string) => {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map(value => {
      const channel = parseInt(value, 16) / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

it('keeps Material foreground/container pairs readable in both themes', () => {
  [lightColors, darkColors].forEach(colors => {
    const pairs = [
      [colors.onSurface, colors.background],
      [colors.onSurface, colors.surfaceContainerLow],
      [colors.onSurfaceVariant, colors.surfaceContainerLow],
      [colors.onPrimary, colors.primary],
      [colors.onPrimary, colors.primaryPressed],
      [colors.primary, colors.background],
      [colors.onPrimaryContainer, colors.primaryContainer],
      [colors.onSecondaryContainer, colors.secondaryContainer],
      [colors.error, colors.surface],
    ];
    pairs.forEach(([foreground, background]) => {
      const values = [luminance(foreground), luminance(background)].sort(
        (a, b) => b - a,
      );
      expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(
        4.5,
      );
    });
  });
});
