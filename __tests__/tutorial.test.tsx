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
const textIncludes = (value: string) =>
  tree!.root.findAllByType(Text).some(node => node.props.children === value);

beforeEach(async () => {
  await AsyncStorage.clear();
});
afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
});

it('shows on first launch, persists skipping and preserves saved players', async () => {
  await AsyncStorage.setItem('names', '["Ada"]');
  await mount();
  expect(visible()).toBe(true);
  await press('Überspringen');
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
  expect(textIncludes('Frage und Buchstabe')).toBe(true);
  await press('Zurück');
  expect(textIncludes('Eine Runde vorbereiten')).toBe(true);
  await press('Weiter');
  await press('Weiter');
  expect(
    tree!.root
      .findAllByType(Text)
      .some(node =>
        String(node.props.children).includes(
          'Halte ihren Punktestand gedrückt',
        ),
      ),
  ).toBe(true);
  expect(
    tree!.root
      .findAllByType(Text)
      .some(node =>
        String(node.props.children).includes('„Neustart“ im Gewinnerdialog'),
      ),
  ).toBe(true);
  await press('Weiter');
  expect(textIncludes('Eigene Themen und Sprache')).toBe(true);
  await press('Los geht’s');
  expect(visible()).toBe(false);
  expect(await AsyncStorage.getItem(TUTORIAL_SEEN_KEY)).toBe('1');
  await press('Replay');
  expect(visible()).toBe(true);
  expect(textIncludes('Eine Runde vorbereiten')).toBe(true);
});

it('localizes the tutorial and treats Android Back as skipping', async () => {
  await AsyncStorage.setItem('@ratekunst/language', 'en');
  await mount();
  expect(textIncludes('Prepare a round')).toBe(true);
  await press('Next');
  expect(textIncludes('Question and letter')).toBe(true);
  expect(textIncludes('Animal')).toBe(true);
  await press('Next');
  expect(
    tree!.root
      .findAllByType(Text)
      .some(node => String(node.props.children).includes('Hold their score')),
  ).toBe(true);
  expect(
    tree!.root
      .findAllByType(Text)
      .some(node =>
        String(node.props.children).includes('“Restart” in the winner dialog'),
      ),
  ).toBe(true);
  await act(async () => tree!.root.findByType(Modal).props.onRequestClose());
  expect(visible()).toBe(false);
  expect(await AsyncStorage.getItem(TUTORIAL_SEEN_KEY)).toBe('1');
});
