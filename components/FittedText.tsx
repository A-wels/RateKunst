import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../constants/theme';

type Props = {
  children: string;
  fontSize: number;
  color?: string;
  singleLine?: boolean;
};

// Give the native text measurer both dimensions. It can then reduce the font
// against the actual available width and height, including grouped letters.
// A fixed lineHeight would prevent Android from shrinking the line boxes.
const FittedText = ({
  children,
  fontSize,
  color = colors.text,
  singleLine = false,
}: Props) => (
  <View style={styles.window}>
    <Text
      key={children}
      accessibilityLiveRegion="polite"
      accessibilityLabel={children}
      adjustsFontSizeToFit
      minimumFontScale={0.1}
      numberOfLines={singleLine ? 1 : undefined}
      style={[styles.text, {fontSize, color}]}>
      {children}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  window: {flex: 1, minHeight: 0},
  text: {
    ...StyleSheet.absoluteFillObject,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontWeight: '500',
  },
});

export default FittedText;
