import React from 'react';
import {
  Platform,
  requireNativeComponent,
  StyleSheet,
  ViewProps,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useMonetization} from '../monetization/MonetizationContext';
import {useTheme} from '../theme/ThemeContext';

const NativeBanner = requireNativeComponent<ViewProps>('RateKunstBanner');

const AdBanner = () => {
  const {available, adsRemoved, adsReady, gameActive} = useMonetization();
  const {colors} = useTheme();
  if (
    Platform.OS !== 'android' ||
    !available ||
    adsRemoved ||
    !adsReady ||
    gameActive
  ) {
    return null;
  }
  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[
        styles.footer,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderTopColor: colors.outlineVariant,
        },
      ]}>
      <NativeBanner style={styles.banner} />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  footer: {borderTopWidth: 1, paddingTop: 8, alignItems: 'center'},
  banner: {width: '100%', height: 50},
});
export default AdBanner;
