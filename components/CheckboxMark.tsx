import React from 'react';
import {StyleSheet, View} from 'react-native';
import {colors} from '../constants/theme';

// The row owns the accessible checkbox and its touch target. This is its
// visual indicator, drawn with native borders rather than font glyphs.
const CheckboxMark = ({checked}: {checked: boolean}) => (
  <View
    pointerEvents="none"
    accessible={false}
    importantForAccessibility="no-hide-descendants"
    style={[styles.box, checked && styles.checked]}>
    {checked && <View style={styles.tick} />}
  </View>
);

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.selection,
    borderRadius: 3,
  },
  checked: {backgroundColor: colors.selection},
  tick: {
    position: 'absolute',
    left: 7,
    top: 2,
    width: 6,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.white,
    transform: [{rotate: '45deg'}],
  },
});

export default CheckboxMark;
