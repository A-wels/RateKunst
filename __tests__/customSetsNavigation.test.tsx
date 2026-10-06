import React from 'react';
import {BackHandler, Platform, Pressable, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import renderer, {act} from 'react-test-renderer';
import {afterAll, afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import App from '../App';
import CustomsetScreen from '../pages/screens/CustomsetScreen';
import EditPage from '../pages/screens/EditPage';
import StartScreen from '../pages/screens/StartScreen';
import {LocalizationProvider} from '../i18n/LocalizationContext';

let tree: renderer.ReactTestRenderer | undefined;
const android = jest.replaceProperty(Platform, 'OS', 'android');
const navigation = {addListener: jest.fn(() => () => {}), navigate: jest.fn()};

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
  // Test the native-stack configuration as well as JS navigation. This cannot
  // simulate Android's fragment animation / touch delivery on a real device.
  expect(
    tree!.root.findAll(node => node.props.stackAnimation === 'none').length,
  ).toBeGreaterThan(0);
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
