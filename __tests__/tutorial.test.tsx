import React from 'react';
import {Modal, Pressable, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it} from '@jest/globals';
import Tutorial from '../components/Tutorial';
import Button from '../components/Button';
import {useTutorial, TUTORIAL_SEEN_KEY} from '../hooks/useTutorial';
import {LocalizationProvider} from '../i18n/LocalizationContext';

let tree: renderer.ReactTestRenderer | undefined;
const Harness = () => {
  const tutorial = useTutorial();
  return (
    <>
      <Button label="Replay" onPress={tutorial.open} />
      <Tutorial visible={tutorial.visible} onClose={tutorial.close} />
    </>
  );
};
const mount = async () => {
  await act(async () => {
    tree = renderer.create(
      <LocalizationProvider>
        <Harness />
      </LocalizationProvider>,
    );
  });
};
const press = async (label: string) => {
  const button = tree!.root
    .findAllByType(Pressable)
    .find(node => node.props.accessibilityLabel === label);
  expect(button).toBeDefined();
  await act(async () => button!.props.onPress());
};
const visible = () => tree!.root.findAllByType(Modal).length > 0;
const stepIs = (step: number) =>
  tree!.root
    .findAllByType(Text)
    .some(node => node.props.children === `${step} von 4`);

beforeEach(async () => {
  await AsyncStorage.clear();
});
afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
});

it('persists first-launch dismissal via Android Back and preserves saved players', async () => {
  await AsyncStorage.setItem('names', '["Ada"]');
  await mount();
  expect(visible()).toBe(true);
  await act(async () => tree!.root.findByType(Modal).props.onRequestClose());
  expect(visible()).toBe(false);
  expect(await AsyncStorage.getItem(TUTORIAL_SEEN_KEY)).toBe('1');
  expect(await AsyncStorage.getItem('names')).toBe('["Ada"]');
  act(() => tree!.unmount());
  await mount();
  expect(visible()).toBe(false);
});

it('can go back, finish and replay from the first step', async () => {
  await mount();
  await press('Weiter');
  expect(stepIs(2)).toBe(true);
  await press('Zurück');
  expect(stepIs(1)).toBe(true);
  await press('Weiter');
  await press('Weiter');
  expect(stepIs(3)).toBe(true);
  await press('Weiter');
  expect(stepIs(4)).toBe(true);
  await press('Los geht’s');
  expect(visible()).toBe(false);
  expect(await AsyncStorage.getItem(TUTORIAL_SEEN_KEY)).toBe('1');
  await press('Replay');
  expect(visible()).toBe(true);
  expect(stepIs(1)).toBe(true);
});
