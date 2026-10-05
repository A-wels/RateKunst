import React from 'react';
import {
  Platform,
  requireNativeComponent,
  StyleSheet,
  Text,
  ViewProps,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useMonetization} from '../monetization/MonetizationContext';
import {useTheme} from '../theme/ThemeContext';
import {useLocalization} from '../i18n/LocalizationContext';

const NativeBanner = requireNativeComponent<ViewProps>('RateKunstBanner');

const AdBanner = () => {
  const {available, adsRemoved, adsReady, gameActive} = useMonetization();
  const {colors} = useTheme();
  const {t} = useLocalization();
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
      <Text style={[styles.label, {color: colors.onSurfaceVariant}]}>
        {t('advertisement')}
      </Text>
      <NativeBanner style={styles.banner} />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  footer: {borderTopWidth: 1, paddingTop: 8, alignItems: 'center'},
  label: {fontSize: 11, marginBottom: 4},
  banner: {width: '100%', height: 50},
});
export default AdBanner;
