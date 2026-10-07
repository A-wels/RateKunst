import React from 'react';
import {useThemedStyles} from '../theme/ThemeContext';
import {StyleSheet, View} from 'react-native';
import {ThemeColors} from '../constants/theme';

// The row owns the accessible checkbox and its touch target. This is its
// visual indicator, drawn with native borders rather than font glyphs.
const CheckboxMark = ({checked}: {checked: boolean}) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, checked && styles.checked]}>
      {checked && <View style={styles.tick} />}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    box: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 3,
    },
    checked: {backgroundColor: colors.primary},
    tick: {
      position: 'absolute',
      left: 7,
      top: 2,
      width: 6,
      height: 12,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderColor: colors.onPrimary,
      transform: [{rotate: '45deg'}],
    },
  });

export default CheckboxMark;
