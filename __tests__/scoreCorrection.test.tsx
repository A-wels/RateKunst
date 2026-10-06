import React from 'react';
import {Pressable} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GameScreen from '../pages/screens/GameScreen';
import FittedText from '../components/FittedText';
import {LocalizationProvider} from '../i18n/LocalizationContext';

let tree: renderer.ReactTestRenderer | undefined;
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useFakeTimers({
    doNotFake: ['nextTick', 'setImmediate', 'clearImmediate'],
  });
});
afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
  jest.useRealTimers();
});
const countdown = async () => {
  for (let i = 0; i < 3; i += 1) {
    await act(async () => jest.advanceTimersByTime(520));
  }
};
const mount = async () => {
  await act(async () => {
    tree = renderer.create(
      <LocalizationProvider>
        <GameScreen
          navigation={{popToTop: jest.fn()}}
          route={{
            params: {
              names: ['Ada', 'Linus'],
              packIds: ['standard'],
              pointsToWin: 10,
              language: 'de',
            },
          }}
        />
      </LocalizationProvider>,
    );
  });
  await countdown();
};
const player = (name: string) =>
  tree!.root
    .findAllByType(Pressable)
    .find(node => node.props.accessibilityLabel?.startsWith(`${name},`))!;
const question = () => tree!.root.findAllByType(FittedText)[0].props.children;

it('corrects a point immediately during the next countdown without changing the question or other scores', async () => {
  await mount();
  act(() => player('Ada').props.onPress());
  expect(player('Ada').props.accessibilityLabel).toBe('Ada, 1 von 10 Punkten');
  expect(player('Ada').props.disabled).toBe(false);
  const currentQuestion = question();
  // Normal scoring remains blocked during the countdown, but correction works.
  act(() => player('Ada').props.onPress());
  act(() => player('Ada').props.onLongPress());
  expect(player('Ada').props.accessibilityLabel).toBe('Ada, 0 von 10 Punkten');
  expect(player('Linus').props.accessibilityLabel).toBe(
    'Linus, 0 von 10 Punkten',
  );
  expect(question()).toBe(currentQuestion);
  await countdown();
  act(() => player('Ada').props.onPress());
  expect(player('Ada').props.accessibilityLabel).toBe('Ada, 1 von 10 Punkten');
});

it('handles repeated corrections atomically, clamps at zero and offers the same action to TalkBack', async () => {
  await mount();
  act(() => player('Ada').props.onPress());
  await countdown();
  act(() => player('Ada').props.onPress());
  await countdown();
  act(() => player('Linus').props.onPress());
  act(() => {
    player('Ada').props.onLongPress();
    player('Ada').props.onLongPress();
    player('Ada').props.onLongPress();
  });
  expect(player('Ada').props.accessibilityLabel).toBe('Ada, 0 von 10 Punkten');
  expect(player('Linus').props.accessibilityLabel).toBe(
    'Linus, 1 von 10 Punkten',
  );
  expect(player('Linus').props.accessibilityActions).toEqual([
    {name: 'decrement', label: 'Einen Punkt abziehen'},
  ]);
  act(() =>
    player('Linus').props.onAccessibilityAction({
      nativeEvent: {actionName: 'decrement'},
    }),
  );
  expect(player('Linus').props.accessibilityLabel).toBe(
    'Linus, 0 von 10 Punkten',
  );
  expect(player('Linus').props.accessibilityActions).toEqual([]);
});
