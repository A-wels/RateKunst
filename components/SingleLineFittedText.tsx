import React from 'react';
import {StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import type {
  LayoutChangeEvent,
  TextLayoutEvent,
} from 'react-native';

type Props = {children: string; fontSize: number; color: string};
type Size = {width: number; height: number};

const SingleLineFittedText = ({children, fontSize, color}: Props) => {
  const {fontScale} = useWindowDimensions();
  const [window, setWindow] = React.useState<Size>({width: 0, height: 0});
  // Remount the measurement when the text, preferred size or system text size
  // changes. Old metrics must never be applied to the next letter group.
  const measurementKey = JSON.stringify([children, fontSize, fontScale]);
  const latestKey = React.useRef(measurementKey);
  latestKey.current = measurementKey;
  const [measurement, setMeasurement] = React.useState<Size & {key: string}>();
  const measured =
    measurement?.key === measurementKey ? measurement : undefined;
  const scale =
    measured && measured.width > 0 && measured.height > 0
      ? Math.max(
          0,
          Math.min(
            1,
            (window.width - 4) / measured.width,
            (window.height - 4) / measured.height,
          ),
        )
      : 0;
  const fittedSize = Math.floor(fontSize * scale * 100) / 100;

  const onLayout = ({nativeEvent: {layout}}: LayoutChangeEvent) => {
    setWindow(current =>
      current.width === layout.width && current.height === layout.height
        ? current
        : {width: layout.width, height: layout.height},
    );
  };
  const onMeasure = ({
    nativeEvent: {lines},
  }: TextLayoutEvent) => {
    if (latestKey.current !== measurementKey) {
      return;
    }
    const line = lines[0];
    if (line && lines.length === 1 && line.text === children) {
      setMeasurement(current =>
        current?.key === measurementKey &&
        current.width === line.width &&
        current.height === line.height
          ? current
          : {key: measurementKey, width: line.width, height: line.height},
      );
    }
  };

  return (
    <View style={styles.window} onLayout={onLayout} pointerEvents="none">
      {children !== '' && (
        <Text
          key={measurementKey}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          onTextLayout={onMeasure}
          style={[styles.text, styles.measurement, {fontSize}]}>
          {children}
        </Text>
      )}
      {fittedSize > 0 && (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityLabel={children}
          numberOfLines={1}
          style={[styles.text, {fontSize: fittedSize, color}]}>
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
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {includeFontPadding: false, fontWeight: '500', textAlign: 'center'},
  // This invisible, unconstrained line measures every glyph, including the Z
  // beyond the narrow letter panel. Native metrics include system font scaling.
  // It is only used for short letters/groups, never question paragraphs.
  measurement: {position: 'absolute', width: 10000, opacity: 0},
});

export default SingleLineFittedText;
