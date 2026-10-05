import React from 'react';
import {Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {loadGameSetup, migrateSelectedPacks} from '../utils/gameSetup';
import StartScreen from '../pages/screens/StartScreen';
import EditPage from '../pages/screens/EditPage';
import {
  LocalizationProvider,
  useLocalization,
} from '../i18n/LocalizationContext';

const navigation = {addListener: () => () => {}, navigate: jest.fn()};
let tree: renderer.ReactTestRenderer | undefined;
const getItemImplementation = jest
  .mocked(AsyncStorage.getItem)
  .getMockImplementation()!;
const setItemImplementation = jest
  .mocked(AsyncStorage.setItem)
  .getMockImplementation()!;

beforeEach(async () => {
  jest.mocked(AsyncStorage.getItem).mockImplementation(getItemImplementation);
  jest.mocked(AsyncStorage.setItem).mockImplementation(setItemImplementation);
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
});

describe('storage compatibility', () => {
  it('migrates old custom-pack indices and deduplicates selections', () => {
    expect(
      migrateSelectedPacks([0, 1, 2, 3, 4, 'standard', null], ['a', 'b']),
    ).toEqual(['standard', 'movies-tv', 'custom:a', 'custom:b']);
    expect(migrateSelectedPacks({}, [])).toEqual([]);
  });

  it('loads valid fields even when another saved field is malformed', async () => {
    await AsyncStorage.multiSet([
      ['names', '["Ada","Linus"]'],
      ['customSet', '{broken'],
      ['pointsToWin', '15'],
    ]);
    expect(await loadGameSetup()).toEqual({
      names: ['Ada', 'Linus'],
      packIds: [],
      pointsToWin: '15',
    });
  });

  it('does not overwrite names before hydration finishes', async () => {
    await AsyncStorage.setItem('names', '["Ada"]');
    const setItem = jest.mocked(AsyncStorage.setItem);
    await act(async () => {
      tree = renderer.create(
        <LocalizationProvider>
          <StartScreen navigation={navigation} />
        </LocalizationProvider>,
      );
    });
    const playerWrites = setItem.mock.calls.filter(([key]) => key === 'names');
    expect(playerWrites.length).toBeGreaterThan(0);
    expect(playerWrites.every(([, value]) => value === '["Ada"]')).toBe(true);
  });

  it('persists migrated custom selections before their index can change', async () => {
    await AsyncStorage.multiSet([
      ['customSet', '[0,2]'],
      ['@customSets', '["a","b"]'],
      ['a', '["Pack A","Category A"]'],
      ['b', '["Pack B","Category B"]'],
    ]);
    await act(async () => {
      tree = renderer.create(
        <LocalizationProvider>
          <StartScreen navigation={navigation} />
        </LocalizationProvider>,
      );
    });
    expect(await AsyncStorage.getItem('customSet')).toBe(
      '["standard","custom:a"]',
    );
    await AsyncStorage.setItem('@customSets', '["b"]');
    expect((await loadGameSetup()).packIds).toEqual(['standard', 'custom:a']);
  });

  it('persists the last editor change after immediate navigation', async () => {
    await AsyncStorage.multiSet([
      ['@customSets', '["a"]'],
      ['a', '["Original","Old category"]'],
    ]);
    await act(async () => {
      tree = renderer.create(
        <LocalizationProvider>
          <EditPage route={{params: {id: 'a'}}} />
        </LocalizationProvider>,
      );
    });
    act(() =>
      tree!.root.findAllByType(TextInput)[1].props.onChangeText('New category'),
    );
    await act(async () => {
      tree!.unmount();
      tree = undefined;
      // Let the serialized storage writes complete after unmount.
      for (let i = 0; i < 10; i += 1) {
        await Promise.resolve();
      }
    });
    expect(await AsyncStorage.getItem('a')).toBe('["Original","New category"]');
  });

  it('allows removing every category from an existing pack', async () => {
    await AsyncStorage.multiSet([
      ['@customSets', '["a"]'],
      ['a', '["Original","Old category"]'],
    ]);
    await act(async () => {
      tree = renderer.create(
        <LocalizationProvider>
          <EditPage route={{params: {id: 'a'}}} />
        </LocalizationProvider>,
      );
    });
    await act(async () =>
      tree!.root.findAllByType(TextInput)[1].props.onChangeText(''),
    );
    expect(await AsyncStorage.getItem('a')).toBe('["Original"]');
  });

  it('does not replace a manual language choice with a delayed saved value', async () => {
    let resolveLanguage: (value: string) => void = () => {};
    jest.mocked(AsyncStorage.getItem).mockImplementation(
      () =>
        new Promise<string>(resolve => {
          resolveLanguage = resolve;
        }),
    );
    const Probe = () => {
      const {language, setLanguage} = useLocalization();
      return <Text onPress={() => setLanguage('en')}>{language}</Text>;
    };
    act(() => {
      tree = renderer.create(
        <LocalizationProvider>
          <Probe />
        </LocalizationProvider>,
      );
    });
    act(() => tree!.root.findByType(Text).props.onPress());
    await act(async () => resolveLanguage('de'));
    expect(tree!.root.findByType(Text).props.children).toBe('en');
  });
});
