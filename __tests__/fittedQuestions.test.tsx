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
const mount = (question = 'Etwas, das man auf eine Party mitbringt') => {
  act(() => {
    tree = renderer.create(<FittedText fontSize={38}>{question}</FittedText>);
  });
};
const resize = (width: number, height: number) => {
  act(() =>
    tree!.root
      .findByType(View)
      .props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width, height}}}),
  );
};
const visible = () =>
  tree!.root
    .findAllByType(Text)
    .find(node => node.props.accessibilityLiveRegion === 'polite')!;
const measurement = () =>
  tree!.root.findAllByType(Text).find(node => node.props.onTextLayout);
const size = () => StyleSheet.flatten(visible().props.style).fontSize;

// Simulate native wrapped line reports, including glyph metrics enlarged by
// the OS. The production component must fit the reports, not guess from text.
const settle = (textWidthAt38: number, fontScale = 1) => {
  for (let attempt = 0; attempt < 10 && measurement(); attempt += 1) {
    const node = measurement()!;
    const style = StyleSheet.flatten(node.props.style);
    const textWidth = (textWidthAt38 * style.fontSize * fontScale) / 38;
    const lineHeight = style.fontSize * 1.2 * fontScale;
    const count = Math.ceil(textWidth / style.width);
    const lines = Array.from({length: count}, (_, index) => ({
      text: 'native line',
      width: Math.min(style.width, textWidth - index * style.width),
      height: lineHeight,
      y: index * lineHeight,
    }));
    act(() => node.props.onTextLayout({nativeEvent: {lines}}));
  }
  expect(measurement()).toBeUndefined();
};

it('keeps a readable question mounted before layout or native measurement', () => {
  mount();
  expect(visible().props.children).toBe(
    'Etwas, das man auf eine Party mitbringt',
  );
  expect(visible().props.accessibilityLabel).toBe(visible().props.children);
  expect(size()).toBe(38);
  expect(visible().props.adjustsFontSizeToFit).toBeUndefined();
  expect(StyleSheet.flatten(visible().props.style).position).toBeUndefined();
  expect(measurement()).toBeUndefined();
  resize(520, 110);
  expect(visible().props.children).toBeTruthy();
  const measuring = measurement()!;
  expect(measuring.props.accessible).toBe(false);
  expect(measuring.props.importantForAccessibility).toBe('no-hide-descendants');
  const style = StyleSheet.flatten(measuring.props.style);
  expect(style.width).toBe(516);
  expect(style.height).toBeUndefined();
  expect(style.bottom).toBeUndefined();
});

it.each([
  [520, 120, 1],
  [360, 80, 1],
  [250, 400, 1],
  [520, 120, 2],
])(
  'fits all wrapped lines in a %sx%s window at font scale %s',
  (width, height, fontScale) => {
    mount();
    resize(width, height);
    settle(1600, fontScale);
    const nativeWidth = (1600 * size() * fontScale) / 38;
    const lines = Math.ceil(nativeWidth / (width - 4));
    expect(lines * size() * 1.2 * fontScale).toBeLessThanOrEqual(height - 4);
    expect(size()).toBeGreaterThan(4);
    expect(size()).toBeLessThanOrEqual(38);
    // The final font is within the binary search tolerance of the largest fit.
    const bigger = Math.min(38, size() + 0.51);
    if (bigger < 38) {
      const biggerLines = Math.ceil(
        (1600 * bigger * fontScale) / 38 / (width - 4),
      );
      expect(biggerLines * bigger * 1.2 * fontScale).toBeGreaterThan(
        height - 4,
      );
    }
  },
);

it('recovers the full size after a transient small or zero window and ignores stale reports', () => {
  mount('3');
  resize(20, 9);
  const oldReport = measurement()!.props.onTextLayout;
  settle(25);
  expect(size()).toBeLessThan(6);
  resize(0, 0);
  expect(visible().props.children).toBe('3');
  expect(measurement()).toBeUndefined();
  resize(520, 120);
  settle(25);
  expect(size()).toBe(38);
  act(() => oldReport({nativeEvent: {lines: [{width: 20, height: 50, y: 0}]}}));
  expect(size()).toBe(38);
});

it('remeasures the next question and ignores a late report from the previous search', () => {
  mount('Eine sehr lange Frage');
  resize(360, 80);
  const oldReport = measurement()!.props.onTextLayout;
  settle(1600);
  expect(size()).toBeLessThan(38);
  act(() => tree!.update(<FittedText fontSize={38}>Tier</FittedText>));
  settle(80);
  expect(size()).toBe(38);
  act(() =>
    oldReport({nativeEvent: {lines: [{width: 200, height: 800, y: 0}]}}),
  );
  expect(visible().props.children).toBe('Tier');
  expect(size()).toBe(38);
});

it('refits the same question after the system font scale changes', () => {
  const original = {
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen'),
  };
  Dimensions.set({window: {...original.window, fontScale: 1}});
  try {
    mount();
    resize(520, 120);
    settle(1600);
    const normalSize = size();
    act(() => Dimensions.set({window: {...original.window, fontScale: 2}}));
    expect(measurement()).toBeDefined();
    settle(1600, 2);
    expect(size()).toBeLessThan(normalSize);
    expect(visible().props.children).toBe(
      'Etwas, das man auf eine Party mitbringt',
    );
  } finally {
    act(() => Dimensions.set(original));
  }
});

it('ignores empty and invalid native reports and keeps displaying the question', () => {
  mount();
  resize(520, 120);
  const report = measurement()!.props.onTextLayout;
  act(() => {
    report({nativeEvent: {lines: []}});
    report({nativeEvent: {lines: [{width: NaN, height: 40, y: 0}]}});
  });
  expect(size()).toBe(38);
  expect(visible().props.children).toBeTruthy();
  settle(1600);
});

it('does not shrink fitting lines because Android includes trailing spaces in their width', () => {
  mount();
  resize(520, 120);
  act(() =>
    measurement()!.props.onTextLayout({
      nativeEvent: {
        lines: [
          {text: 'Etwas, das man auf eine ', width: 530, height: 45, y: 0},
          {text: 'Party mitbringt', width: 270, height: 45, y: 45},
        ],
      },
    }),
  );
  expect(size()).toBe(38);
  expect(measurement()).toBeUndefined();
});
