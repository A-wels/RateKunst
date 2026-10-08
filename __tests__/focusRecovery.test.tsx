import React from 'react';
import {
  AppState,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Text,
  TextInput,
} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ForegroundModal from '../components/ForegroundModal';
import PackPicker from '../components/PackPicker';
import Tutorial from '../components/Tutorial';
import {LocalizationProvider} from '../i18n/LocalizationContext';
import {
  InputRecoveryProvider,
  useInputRecovery,
} from '../hooks/useInputRecovery';
import StartScreen from '../pages/screens/StartScreen';
import GameScreen from '../pages/screens/GameScreen';

let tree: renderer.ReactTestRenderer | undefined;
let listeners: Map<string, Set<(state: any) => void>>;
const emit = (event: string, state?: string) =>
  act(() => listeners.get(event)?.forEach(listener => listener(state)));
let restoreAppState: () => void;
let restorePlatform: () => void;

beforeEach(async () => {
  await AsyncStorage.clear();

  const platform = jest.replaceProperty(Platform, 'OS', 'android');
  restorePlatform = platform.restore;
  listeners = new Map();
  const appState = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((event, listener) => {
      const handlers = listeners.get(event) ?? new Set();
      handlers.add(listener);
      listeners.set(event, handlers);
      return {remove: () => handlers.delete(listener)};
    });
  restoreAppState = () => appState.mockRestore();
});
afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
  restoreAppState();
  restorePlatform();
});

it('releases the content responder after a notification shade or background interruption', () => {
  let generation = -1;
  const Harness = () => {
    generation = useInputRecovery();
    return null;
  };
  act(() => {
    tree = renderer.create(<Harness />);
  });
  emit('focus');
  expect(generation).toBe(0);
  emit('blur');
  emit('focus');
  expect(generation).toBe(1);
  emit('change', 'background');
  emit('change', 'active');
  emit('focus');
  expect(generation).toBe(2);
  act(() => tree!.unmount());
  expect([...listeners.values()].every(handlers => handlers.size === 0)).toBe(
    true,
  );
});

it('recreates interrupted scroll content while keeping the screen, draft input and offset', async () => {
  await AsyncStorage.setItem('@ratekunst/tutorial-seen', '1');
  await act(async () => {
    tree = renderer.create(
      <InputRecoveryProvider>
        <LocalizationProvider>
          <StartScreen navigation={{addListener: () => () => {}}} />
        </LocalizationProvider>
      </InputRecoveryProvider>,
    );
  });
  const input = () =>
    tree!.root
      .findAllByType(TextInput)
      .find(node => node.props.accessibilityLabel === 'Name eingeben')!;
  act(() => input().props.onChangeText('Ada'));
  const screen = tree!.root.findByType(StartScreen);
  let scroll = tree!.root.findByType(ScrollView);
  act(() =>
    scroll.props.onScroll({nativeEvent: {contentOffset: {x: 0, y: 180}}}),
  );
  for (let i = 0; i < 2; i++) {
    // Include batched pause/resume to ensure an interrupted stream is replaced.
    act(() => {
      listeners.get('change')?.forEach(listener => listener('background'));
      listeners.get('change')?.forEach(listener => listener('active'));
    });
    const next = tree!.root.findByType(ScrollView);
    expect(next).not.toBe(scroll);
    expect(next.props.contentOffset).toEqual({x: 0, y: 180});
    expect(tree!.root.findByType(StartScreen)).toBe(screen);
    expect(input().props.value).toBe('Ada');
    scroll = next;
  }
  await act(async () =>
    tree!.root
      .findAllByType(Pressable)
      .find(node => node.props.accessibilityLabel === 'Spieler hinzufügen')!
      .props.onPress(),
  );
  expect(await AsyncStorage.getItem('names')).toBe('["Ada"]');
});

it('retains the current round and score through blur/focus and allows correction afterward', async () => {
  jest.useFakeTimers({
    doNotFake: ['nextTick', 'setImmediate', 'clearImmediate'],
  });
  try {
    await act(async () => {
      tree = renderer.create(
        <InputRecoveryProvider>
          <LocalizationProvider>
            <GameScreen
              navigation={{popToTop: jest.fn()}}
              route={{
                params: {
                  names: ['Ada'],
                  packIds: ['standard'],
                  pointsToWin: 10,
                  language: 'de',
                },
              }}
            />
          </LocalizationProvider>
        </InputRecoveryProvider>,
      );
    });
    for (let i = 0; i < 3; i++) {
      await act(async () => jest.advanceTimersByTime(520));
    }
    const score = () =>
      tree!.root
        .findAllByType(Pressable)
        .find(node => node.props.accessibilityLabel?.startsWith('Ada,'))!;
    act(() => score().props.onPress());
    const screen = tree!.root.findByType(GameScreen);
    const scroll = tree!.root.findByType(ScrollView);
    emit('blur');
    emit('focus');
    expect(tree!.root.findByType(ScrollView)).not.toBe(scroll);
    expect(tree!.root.findByType(GameScreen)).toBe(screen);
    expect(score().props.accessibilityLabel).toBe('Ada, 1 von 10 Punkten');
    act(() => score().props.onLongPress());
    expect(score().props.accessibilityLabel).toBe('Ada, 0 von 10 Punkten');
  } finally {
    jest.useRealTimers();
  }
});

it('recreates the native window even when background/resume events are batched', () => {
  act(() => {
    tree = renderer.create(
      <ForegroundModal visible>
        <Text>Open</Text>
      </ForegroundModal>,
    );
  });
  const original = tree!.root.findByType(Modal);
  act(() => {
    listeners.get('change')?.forEach(listener => listener('background'));
    listeners.get('change')?.forEach(listener => listener('active'));
  });
  expect(tree!.root.findByType(Modal)).not.toBe(original);
});

it('keeps picker search and selections through repeated resumes, and releases the window on close', async () => {
  const Harness = () => {
    const [visible, setVisible] = React.useState(true);
    const [selectedIds, onChange] = React.useState(['standard']);
    return (
      <PackPicker
        visible={visible}
        packs={[
          {label: 'Standard', value: 'standard'},
          {label: 'Movies', value: 'movies'},
        ]}
        selectedIds={selectedIds}
        onChange={onChange}
        onClose={() => setVisible(false)}
      />
    );
  };
  await act(async () => {
    tree = renderer.create(
      <LocalizationProvider>
        <Harness />
      </LocalizationProvider>,
    );
  });
  act(() => tree!.root.findByType(TextInput).props.onChangeText('Movies'));
  const press = (label: string) =>
    act(() =>
      tree!.root
        .findAllByType(Pressable)
        .find(node => node.props.accessibilityLabel === label)!
        .props.onPress(),
    );
  press('Movies');
  for (let i = 0; i < 3; i++) {
    emit('change', 'background');
    expect(tree!.root.findAllByType(Modal)).toHaveLength(0);
    emit('change', 'active');
    expect(tree!.root.findByType(TextInput).props.value).toBe('Movies');
    expect(tree!.root.findByType(PackPicker).props.selectedIds).toEqual([
      'standard',
      'movies',
    ]);
  }
  press('Movies');
  expect(tree!.root.findByType(PackPicker).props.selectedIds).toEqual([
    'standard',
  ]);
  press('Fertig');
  emit('change', 'background');
  emit('change', 'active');
  expect(tree!.root.findAllByType(Modal)).toHaveLength(0);
});

it('keeps the tutorial step on resume and remains closed after skipping', async () => {
  const Harness = () => {
    const [visible, setVisible] = React.useState(true);
    return <Tutorial visible={visible} onClose={() => setVisible(false)} />;
  };
  await act(async () => {
    tree = renderer.create(
      <LocalizationProvider>
        <Harness />
      </LocalizationProvider>,
    );
  });
  const press = (label: string) =>
    act(() =>
      tree!.root
        .findAllByType(Pressable)
        .find(node => node.props.accessibilityLabel === label)!
        .props.onPress(),
    );
  press('Weiter');
  emit('change', 'background');
  emit('change', 'active');
  expect(
    tree!.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Frage und Buchstabe'),
  ).toBe(true);
  press('Überspringen');
  emit('change', 'background');
  emit('change', 'active');
  expect(tree!.root.findAllByType(Modal)).toHaveLength(0);
});
