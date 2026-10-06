import React from 'react';
import {
  AppState,
  Modal,
  Pressable,
  Platform,
  Text,
  TextInput,
  UIManager,
} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ForegroundModal from '../components/ForegroundModal';
import PackPicker from '../components/PackPicker';
import Tutorial from '../components/Tutorial';
import {LocalizationProvider} from '../i18n/LocalizationContext';
import {useInputRecovery} from '../hooks/useInputRecovery';

let tree: renderer.ReactTestRenderer | undefined;
let listeners: Map<string, Set<(state: any) => void>>;
const emit = (event: string, state?: string) =>
  act(() => listeners.get(event)?.forEach(listener => listener(state)));
const manager = UIManager as typeof UIManager & {clearJSResponder: () => void};
const originalClearResponder = manager.clearJSResponder;
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
  manager.clearJSResponder = jest.fn();
});
afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
  manager.clearJSResponder = originalClearResponder;
  restoreAppState();
  restorePlatform();
});

it('releases the content responder after a notification shade or background interruption', () => {
  const Harness = () => {
    useInputRecovery();
    return null;
  };
  act(() => {
    tree = renderer.create(<Harness />);
  });
  emit('focus');
  expect(manager.clearJSResponder).not.toHaveBeenCalled();
  emit('blur');
  emit('focus');
  expect(manager.clearJSResponder).toHaveBeenCalledTimes(1);
  emit('change', 'background');
  emit('change', 'active');
  emit('focus');
  expect(manager.clearJSResponder).toHaveBeenCalledTimes(2);
  act(() => tree!.unmount());
  expect([...listeners.values()].every(handlers => handlers.size === 0)).toBe(
    true,
  );
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
