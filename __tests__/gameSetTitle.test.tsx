import React from 'react';
import {Pressable, Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GameScreen from '../pages/screens/GameScreen';
import {LocalizationProvider} from '../i18n/LocalizationContext';
import * as loader from '../utils/questionloader';

let tree: renderer.ReactTestRenderer | undefined;
let restore: (() => void)[] = [];
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useFakeTimers();
});
afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
  restore.forEach(fn => fn());
  restore = [];
  jest.useRealTimers();
});
const countdown = async () => {
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      jest.advanceTimersByTime(520);
    });
  }
};
const textPresent = (text: string) =>
  tree!.root.findAllByType(Text).some(node => node.props.children === text);
const mount = async (language: 'de' | 'en', packIds: string[]) => {
  await AsyncStorage.setItem('@ratekunst/language', language);
  await act(async () => {
    tree = renderer.create(
      <LocalizationProvider>
        <GameScreen
          navigation={{popToTop: jest.fn()}}
          route={{
            params: {
              names: ['Ada', 'Linus'],
              packIds,
              pointsToWin: 10,
              language,
            },
          }}
        />
      </LocalizationProvider>,
    );
  });
  await countdown();
};

it('retains the correct source when identical questions occur in different sets', async () => {
  const packs = jest.spyOn(loader, 'getQuestions').mockResolvedValue([
    {id: 'custom:a', title: 'Filmabend', questions: ['Eine Figur']},
    {id: 'custom:b', title: 'Unser Serienabend', questions: ['Eine Figur']},
  ]);
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  restore.push(
    () => packs.mockRestore(),
    () => random.mockRestore(),
  );
  await mount('de', ['custom:a', 'custom:b']);
  expect(textPresent('Filmabend')).toBe(true);
  expect(textPresent('Eine Figur')).toBe(true);
  random.mockReturnValue(0.99);
  const skip = tree!.root
    .findAllByType(Pressable)
    .find(node => node.props.accessibilityLabel === 'Überspringen')!;
  act(() => {
    skip.props.onPress();
  });
  await countdown();
  expect(textPresent('Unser Serienabend')).toBe(true);
  expect(textPresent('Eine Figur')).toBe(true);
});
