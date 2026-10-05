import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {ThemeColors, radii, spacing} from '../constants/theme';
import {useTheme, useThemedStyles} from '../theme/ThemeContext';

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
}: Props) => {
  const {colors} = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{color: colors.outlineVariant}}
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
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    secondary: {borderWidth: 1, borderColor: colors.outline},
    pressed: {backgroundColor: colors.surface},
    primaryPressed: {backgroundColor: colors.primaryPressed},
    disabled: {opacity: 0.5},
    label: {color: colors.primary, fontSize: 16, fontWeight: '500'},
    primaryLabel: {color: colors.onPrimary},
    dangerLabel: {color: colors.error},
  });

export default Button;
