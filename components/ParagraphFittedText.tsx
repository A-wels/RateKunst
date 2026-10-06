import React from 'react';
import {StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import type {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextLayoutEventData,
} from 'react-native';

type Props = {children: string; fontSize: number; color: string};
type Size = {width: number; height: number};
type Fit = {
  key: string;
  size: number;
  low: number;
  high: number;
  complete: boolean;
};

// Android RN 0.72 auto-fit mutates native text spans during measurement. Avoid
// depending on that measurement for an absolutely filled question, especially
// while navigation and orientation are still changing its available bounds.
const ParagraphFittedText = ({children, fontSize, color}: Props) => {
  const {fontScale} = useWindowDimensions();
  const [window, setWindow] = React.useState<Size>({width: 0, height: 0});
  const minimum = Math.min(4, fontSize);
  const key = JSON.stringify([
    children,
    fontSize,
    fontScale,
    window.width,
    window.height,
  ]);
  const [savedFit, setFit] = React.useState<Fit>();
  const fit: Fit =
    savedFit?.key === key
      ? savedFit
      : {key, size: fontSize, low: minimum, high: fontSize, complete: false};
  const latest = React.useRef({key, size: fit.size});
  latest.current = {key, size: fit.size};
  const width = Math.max(0, window.width - 4);
  const height = Math.max(0, window.height - 4);

  const onLayout = ({nativeEvent: {layout}}: LayoutChangeEvent) => {
    setWindow(current =>
      current.width === layout.width && current.height === layout.height
        ? current
        : {width: layout.width, height: layout.height},
    );
  };
  const onMeasure = ({
    nativeEvent: {lines},
  }: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (
      latest.current.key !== key ||
      latest.current.size !== fit.size ||
      fit.complete ||
      lines.length === 0 ||
      lines.some(line =>
        [line.width, line.height, line.y].some(
          value => !Number.isFinite(value),
        ),
      )
    ) {
      return;
    }
    // Native wrapping already bounds the ink width. Android's line.width can
    // include trailing spaces beyond that bound; they must not shrink the text.
    const fits = lines.every(line => line.y + line.height <= height);
    if (fits && fit.size === fontSize) {
      setFit({...fit, complete: true});
      return;
    }
    const low = fits ? fit.size : fit.low;
    const high = fits ? fit.high : fit.size;
    const complete = high - low <= 0.5;
    const size = complete ? low : Math.floor(((low + high) / 2) * 100) / 100;
    setFit({key, size, low, high, complete});
  };

  return (
    <View style={styles.window} onLayout={onLayout} pointerEvents="none">
      {/* Keep the real question mounted even before a native measurement. */}
      <Text
        accessibilityLiveRegion="polite"
        accessibilityLabel={children}
        style={[styles.text, {fontSize: fit.size, color}]}>
        {children}
      </Text>
      {children !== '' && width > 0 && height > 0 && !fit.complete && (
        <Text
          key={JSON.stringify([key, fit.size])}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          onTextLayout={onMeasure}
          style={[
            styles.text,
            styles.measurement,
            {width, fontSize: fit.size},
          ]}>
          {children}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  window: {
    flex: 1,
    minHeight: 0,
    padding: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    width: '100%',
    textAlign: 'center',
    includeFontPadding: false,
    fontWeight: '500',
  },
  // Only width is constrained: native layout reports every wrapped line at the
  // requested font size. This copy never draws or participates in accessibility.
  measurement: {position: 'absolute', top: 2, left: 2, opacity: 0},
});

export default ParagraphFittedText;
