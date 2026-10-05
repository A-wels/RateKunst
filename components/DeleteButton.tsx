import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {ThemeColors, radii} from '../constants/theme';
import {useTheme, useThemedStyles} from '../theme/ThemeContext';

type Props = {accessibilityLabel: string; onPress: () => void};

const DeleteButton = ({accessibilityLabel, onPress}: Props) => {
  const {colors} = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      android_ripple={{color: colors.errorContainer}}
      style={({pressed}) => [styles.button, pressed && styles.pressed]}>
      <View
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={styles.icon}>
        <View style={styles.handle} />
        <View style={styles.lid} />
        <View style={styles.bin} />
        <View style={[styles.slit, styles.leftSlit]} />
        <View style={[styles.slit, styles.rightSlit]} />
      </View>
    </Pressable>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.control,
      overflow: 'hidden',
    },
    pressed: {backgroundColor: colors.errorContainer},
    icon: {width: 24, height: 24},
    handle: {
      position: 'absolute',
      top: 1,
      left: 8,
      width: 8,
      height: 5,
      borderWidth: 2,
      borderBottomWidth: 0,
      borderColor: colors.error,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
    },
    lid: {
      position: 'absolute',
      top: 5,
      left: 2,
      width: 20,
      height: 2,
      backgroundColor: colors.error,
    },
    bin: {
      position: 'absolute',
      top: 7,
      left: 4,
      width: 16,
      height: 15,
      borderWidth: 2,
      borderTopWidth: 0,
      borderColor: colors.error,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
    },
    slit: {
      position: 'absolute',
      top: 10,
      width: 2,
      height: 8,
      backgroundColor: colors.error,
    },
    leftSlit: {left: 9},
    rightSlit: {left: 13},
  });

export default DeleteButton;
