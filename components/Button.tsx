import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {colors, radii, spacing} from '../constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  disabled?: boolean;
  accessibilityLabel?: string;
};

const Button = ({
  label,
  onPress,
  variant = 'secondary',
  disabled = false,
  accessibilityLabel = label,
}: Props) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{disabled}}
    disabled={disabled}
    onPress={onPress}
    android_ripple={{color: colors.border}}
    style={({pressed}) => [
      styles.button,
      variant === 'primary' && styles.primary,
      variant === 'secondary' && styles.secondary,
      pressed && styles.pressed,
      pressed && variant === 'primary' && styles.primaryPressed,
      disabled && styles.disabled,
    ]}>
    <Text
      style={[
        styles.label,
        variant === 'primary' && styles.primaryLabel,
        variant === 'danger' && styles.dangerLabel,
      ]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    overflow: 'hidden',
  },
  primary: {backgroundColor: colors.primary},
  secondary: {borderWidth: 1, borderColor: colors.inputBorder},
  pressed: {backgroundColor: colors.surface},
  primaryPressed: {backgroundColor: colors.primaryPressed},
  disabled: {opacity: 0.5},
  label: {color: colors.primary, fontSize: 16, fontWeight: '500'},
  primaryLabel: {color: colors.white},
  dangerLabel: {color: colors.danger},
});

export default Button;
