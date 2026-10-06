import React from 'react';
import {useTheme} from '../theme/ThemeContext';
import {StyleSheet, Text, View} from 'react-native';
import SingleLineFittedText from './SingleLineFittedText';

type Props = {
  children: string;
  fontSize: number;
  color?: string;
  singleLine?: boolean;
};

// Paragraphs retain native fitting against the bounded question window.
// Single-line letters use measured glyph dimensions rather than Android auto-fit.
const FittedText = ({children, fontSize, color, singleLine = false}: Props) => {
  const {colors} = useTheme();
  const textColor = color ?? colors.onSurface;
  return singleLine ? (
    <SingleLineFittedText fontSize={fontSize} color={textColor}>
      {children}
    </SingleLineFittedText>
  ) : (
    <View style={styles.window}>
      <Text
        key={children}
        accessibilityLiveRegion="polite"
        accessibilityLabel={children}
        adjustsFontSizeToFit
        minimumFontScale={0.1}
        style={[styles.text, {fontSize, color: textColor}]}>
        {children}
      </Text>
    </View>
  );
};

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
