import React from 'react';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {afterEach, expect, it} from '@jest/globals';
import FittedText from '../components/FittedText';

let tree: renderer.ReactTestRenderer | undefined;
afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
});
const mount = (letter: string) => {
  act(() => {
    tree = renderer.create(
      <FittedText fontSize={72} singleLine>
        {letter}
      </FittedText>,
    );
  });
};
const resize = (width: number, height: number) => {
  act(() =>
    tree!.root
      .findByType(View)
      .props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width, height}}}),
  );
};
const measure = (text: string, width: number, height: number) => {
  act(() =>
    tree!.root
      .findAllByType(Text)
      .find(node => node.props.onTextLayout)!
      .props.onTextLayout({nativeEvent: {lines: [{text, width, height}]}}),
  );
};
const displayed = () =>
  tree!.root
    .findAllByType(Text)
    .find(node => node.props.accessibilityLiveRegion === 'polite');
const size = () => StyleSheet.flatten(displayed()!.props.style).fontSize;

it('fits the full letter group against measured width and height', () => {
  const letter = 'X / Y / Z';
  mount(letter);
  resize(150, 110);
  measure(letter, 288, 84);
  expect(displayed()!.props.children).toBe(letter);
  expect((288 * size()) / 72).toBeLessThanOrEqual(146);
  expect((84 * size()) / 72).toBeLessThanOrEqual(106);
});

it('refits on resizing and does not retain the smaller size for a single letter', () => {
  mount('X / Y / Z');
  resize(150, 110);
  measure('X / Y / Z', 288, 84);
  const narrow = size();
  resize(300, 40);
  expect(size()).toBeLessThan(narrow); // Height is now the limiting dimension.
  resize(400, 110);
  expect(size()).toBe(72);
  act(() =>
    tree!.update(
      <FittedText fontSize={72} singleLine>
        B
      </FittedText>,
    ),
  );
  expect(displayed()).toBeUndefined();
  measure('B', 48, 84);
  expect(size()).toBe(72);
});

it('ignores late measurements from the previous group', () => {
  mount('X / Y / Z');
  resize(180, 110);
  const oldMeasure = tree!.root.findByType(Text).props.onTextLayout;
  act(() =>
    tree!.update(
      <FittedText fontSize={72} singleLine>
        SCH / Q
      </FittedText>,
    ),
  );
  measure('SCH / Q', 250, 84);
  const correctSize = size();
  act(() =>
    oldMeasure({
      nativeEvent: {lines: [{text: 'X / Y / Z', width: 300, height: 84}]},
    }),
  );
  expect(size()).toBe(correctSize);
  expect(displayed()!.props.children).toBe('SCH / Q');
});

it('accounts for enlarged system text and excludes the measuring copy from accessibility', () => {
  const original = {
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen'),
  };
  Dimensions.set({window: {width: 740, height: 360, scale: 2, fontScale: 1.5}});
  try {
    mount('X / Y / Z');
    resize(150, 110);
    measure('X / Y / Z', 432, 126); // Metrics already include 150% system text.
    expect((432 * size()) / 72).toBeLessThanOrEqual(146);
    const hidden = tree!.root
      .findAllByType(Text)
      .find(node => node.props.onTextLayout)!;
    expect(hidden.props.accessible).toBe(false);
    expect(hidden.props.importantForAccessibility).toBe('no-hide-descendants');
    act(() =>
      Dimensions.set({
        window: {width: 740, height: 360, scale: 2, fontScale: 2},
      }),
    );
    expect(displayed()).toBeUndefined();
    measure('X / Y / Z', 576, 168);
    expect((576 * size()) / 72).toBeLessThanOrEqual(146);
  } finally {
    act(() => Dimensions.set(original));
  }
});
