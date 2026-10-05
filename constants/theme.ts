// Material color roles, using RateKunst's warm peach/orange seed palette.
// Pair each container with its matching "on" color in both schemes.
export const lightColors = {
  background: '#FFF8F5',
  surface: '#FFF8F5',
  surfaceContainerLow: '#FFF1EA',
  surfaceContainerHigh: '#F4E3DB',
  onSurface: '#241A15',
  onSurfaceVariant: '#53433B',
  outline: '#85736B',
  outlineVariant: '#D7C2B7',
  primary: '#8F4C32',
  primaryPressed: '#71361F',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFDBCD',
  onPrimaryContainer: '#71361F',
  secondary: '#705A3D',
  secondaryContainer: '#F5DFBB',
  onSecondaryContainer: '#534025',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
} as const;

export type ThemeColors = {[Role in keyof typeof lightColors]: string};

export const darkColors: ThemeColors = {
  background: '#1A120F',
  surface: '#1A120F',
  surfaceContainerLow: '#251A15',
  surfaceContainerHigh: '#3D2E27',
  onSurface: '#F4E3DB',
  onSurfaceVariant: '#D7C2B7',
  outline: '#A08D83',
  outlineVariant: '#53433B',
  primary: '#FFB596',
  primaryPressed: '#DDA087',
  onPrimary: '#55200B',
  primaryContainer: '#71361F',
  onPrimaryContainer: '#FFDBCD',
  secondary: '#DEC3A0',
  secondaryContainer: '#59452B',
  onSecondaryContainer: '#F5DFBB',
  error: '#FFB4AB',
  errorContainer: '#93000A',
};

export const radii = {control: 6};
export const spacing = {xs: 4, sm: 8, md: 16, lg: 24, xl: 32};
