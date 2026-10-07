import React from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import renderer, {act} from 'react-test-renderer';
import {afterAll, afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import App from '../App';
import CustomsetScreen from '../pages/screens/CustomsetScreen';
import EditPage from '../pages/screens/EditPage';
import StartScreen from '../pages/screens/StartScreen';
import GameScreen from '../pages/screens/GameScreen';
import SettingsScreen from '../pages/screens/SettingsScreen';
import {LocalizationProvider} from '../i18n/LocalizationContext';

let tree: renderer.ReactTestRenderer | undefined;
const android = jest.replaceProperty(Platform, 'OS', 'android');
const navigation = {addListener: jest.fn(() => () => {}), navigate: jest.fn()};

it('retains setup and game state over repeated resumes, back navigation and a winning restart', async () => {
  jest.useFakeTimers({
    doNotFake: ['nextTick', 'setImmediate', 'clearImmediate'],
  });
  const handlers = new Map<string, Set<(state: any) => void>>();
  const originalAppState = AppState.addEventListener;
  AppState.addEventListener = jest.fn((event, listener) => {
    const list = handlers.get(event) ?? new Set();
    list.add(listener);
    handlers.set(event, list);
    return {remove: () => list.delete(listener)};
  });
  const display = NativeModules.RateKunstDisplay;
  NativeModules.RateKunstDisplay = {setGameActive: jest.fn()};
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const resume = () =>
    act(() => {
      handlers.get('blur')?.forEach(listener => listener(undefined));
      handlers.get('change')?.forEach(listener => listener('background'));
      handlers.get('change')?.forEach(listener => listener('active'));
      handlers.get('focus')?.forEach(listener => listener(undefined));
    });
  const countdown = async () => {
    for (let i = 0; i < 3; i++) {
      await act(async () => jest.advanceTimersByTime(520));
    }
  };

  try {
    await act(async () => {
      tree = renderer.create(<App />);
    });
    const home = tree!.root.findByType(StartScreen);
    const input = () =>
      home
        .findAllByType(TextInput)
        .find(node => node.props.accessibilityLabel === 'Name eingeben')!;
    act(() => input().props.onChangeText('Ad'));
    await press('Einstellungen');
    const settings = tree!.root.findByType(SettingsScreen);
    for (let i = 0; i < 3; i++) {
      resume();
      expect(tree!.root.findByType(SettingsScreen)).toBe(settings);
    }
    await act(async () => home.props.navigation.goBack());
    expect(tree!.root.findByType(StartScreen)).toBe(home);
    expect(input().props.value).toBe('Ad');
    let scroll = home.findByType(ScrollView);
    for (let i = 0; i < 3; i++) {
      resume();
      const next = home.findByType(ScrollView);
      expect(next).not.toBe(scroll);
      scroll = next;
      expect(input().props.value).toBe('Ad');
    }
    act(() => input().props.onChangeText('Ada'));
    await press('Spieler hinzufügen');
    act(() =>
      home
        .findAllByType(TextInput)
        .find(node => node.props.accessibilityLabel === 'Siegpunkte')!
        .props.onChangeText('2'),
    );
    await press('Runde starten');
    const game = tree!.root.findByType(GameScreen);
    expect(game.props.route.params).toEqual({
      names: ['Ada'],
      packIds: ['standard'],
      pointsToWin: 2,
      language: 'de',
    });
    expect(
      NativeModules.RateKunstDisplay.setGameActive,
    ).toHaveBeenLastCalledWith(true);
    await countdown();
    const score = () =>
      tree!.root
        .findByType(GameScreen)
        .findAllByType(Pressable)
        .find(node => node.props.accessibilityLabel?.startsWith('Ada,'))!;
    act(() => score().props.onPress());
    resume();
    expect(tree!.root.findByType(GameScreen)).toBe(game);
    expect(score().props.accessibilityLabel).toBe('Ada, 1 von 2 Punkten');
    act(() => score().props.onLongPress());
    expect(score().props.accessibilityLabel).toBe('Ada, 0 von 2 Punkten');
    await countdown();
    act(() => score().props.onPress());
    await countdown();
    act(() => score().props.onPress());
    await act(async () =>
      alert.mock.calls[0][2]!.find(button => button.text === 'Neustart')!
        .onPress!(),
    );
    expect(tree!.root.findByType(GameScreen)).not.toBe(game);
    expect(score().props.accessibilityLabel).toBe('Ada, 0 von 2 Punkten');
    expect(
      NativeModules.RateKunstDisplay.setGameActive,
    ).toHaveBeenLastCalledWith(true);
    await act(async () =>
      tree!.root.findByType(GameScreen).props.navigation.popToTop(),
    );
    expect(tree!.root.findByType(StartScreen)).toBe(home);
    expect(
      NativeModules.RateKunstDisplay.setGameActive,
    ).toHaveBeenLastCalledWith(false);
    expect(await AsyncStorage.getItem('names')).toBe('["Ada"]');
  } finally {
    act(() => tree?.unmount());
    tree = undefined;
    expect([...handlers.values()].every(list => list.size === 0)).toBe(true);
    alert.mockRestore();
    AppState.addEventListener = originalAppState;
    NativeModules.RateKunstDisplay = display;
    jest.useRealTimers();
  }
});

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  await AsyncStorage.setItem('@ratekunst/tutorial-seen', '1');
});
afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
});
afterAll(() => android.restore());

const press = async (label: string) => {
  const button = tree!.root
    .findAllByType(Pressable)
    .find(node => node.props.accessibilityLabel === label);
  expect(button).toBeDefined();
  await act(async () => button!.props.onPress());
};

it('opens custom sets, edits a pack and returns with working controls', async () => {
  await act(async () => {
    tree = renderer.create(<App />);
  });
  await press('Eigene Sets verwalten');
  expect(tree!.root.findAllByType(CustomsetScreen)).toHaveLength(1);
  await press('Neues Set');
  const editor = tree!.root.findByType(EditPage);
  await act(async () => {
    editor.findAllByType(TextInput)[0].props.onChangeText('Unser Filmabend');
    editor.findAllByType(TextInput)[1].props.onChangeText('Eine Serie');
  });
  await act(async () => editor.props.navigation.goBack());
  expect(
    tree!.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Unser Filmabend'),
  ).toBe(true);
  await press('Bearbeiten Unser Filmabend');
  expect(
    tree!.root.findByType(EditPage).findAllByType(TextInput)[1].props.value,
  ).toBe('Eine Serie');
});

it('system back pops one screen at a time and only falls through on Home', async () => {
  const registration = jest.spyOn(BackHandler, 'addEventListener');
  try {
    await act(async () => {
      tree = renderer.create(<App />);
    });
    const back = registration.mock.calls.find(
      ([event]) => event === 'hardwareBackPress',
    )![1];
    const routes = () =>
      tree!.root
        .findByType(StartScreen)
        .props.navigation.getState()
        .routes.map((route: {name: string}) => route.name);
    await press('Einstellungen');
    expect(routes()).toEqual(['Home', 'Settings']);
    await act(async () => expect(back()).toBe(true));
    expect(routes()).toEqual(['Home']);
    await press('Eigene Sets verwalten');
    await press('Neues Set');
    expect(routes()).toEqual(['Home', 'CustomSets', 'EditSet']);
    await act(async () => expect(back()).toBe(true));
    expect(routes()).toEqual(['Home', 'CustomSets']);
    await act(async () => expect(back()).toBe(true));
    expect(routes()).toEqual(['Home']);
    expect(back()).toBe(false);
  } finally {
    registration.mockRestore();
  }
});

it('skips corrupt and missing records, deduplicates IDs and finishes loading', async () => {
  await AsyncStorage.multiSet([
    ['@customSets', '["a","bad","missing","a",42,null,"wrong"]'],
    ['a', '["Unser Set","Frage eins","Frage zwei"]'],
    ['bad', '{broken'],
    ['wrong', '{"title":"Legacy object"}'],
  ]);
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    await act(async () => {
      tree = renderer.create(
        <LocalizationProvider>
          <CustomsetScreen navigation={navigation} />
        </LocalizationProvider>,
      );
    });
    const titles = tree!.root
      .findAllByType(Text)
      .filter(node => node.props.children === 'Unser Set');
    expect(titles).toHaveLength(1);
    expect(
      tree!.root
        .findAllByType(Text)
        .some(node => node.props.children === '2 Fragen'),
    ).toBe(true);
    expect(
      jest
        .mocked(AsyncStorage.multiGet)
        .mock.calls.filter(([ids]) => ids.length > 1),
    ).toHaveLength(1);
    await press('Neues Set');
    expect(navigation.navigate).toHaveBeenCalledWith('EditSet', {id: null});
  } finally {
    warning.mockRestore();
  }
});
