import React from 'react';
import Button from '../../components/Button';
import {useMonetization} from '../../monetization/MonetizationContext';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {spacing, radii, ThemeColors} from '../../constants/theme';
import {TranslationKey, useLocalization} from '../../i18n/LocalizationContext';
import {
  ThemePreference,
  useTheme,
  useThemedStyles,
} from '../../theme/ThemeContext';

const themeOptions: {
  value: ThemePreference;
  label: TranslationKey;
  hint: TranslationKey;
}[] = [
  {value: 'system', label: 'themeSystem', hint: 'themeSystemHint'},
  {value: 'light', label: 'themeLight', hint: 'themeLightHint'},
  {value: 'dark', label: 'themeDark', hint: 'themeDarkHint'},
];

const SettingsScreen = () => {
  const {t, language, setLanguage} = useLocalization();
  const {colors, preference, setPreference} = useTheme();
  const styles = useThemedStyles(createStyles);
  const monetization = useMonetization();
  const [diagnosticsOpen, setDiagnosticsOpen] = React.useState(false);
  const diagnostics = monetization.diagnostics;
  const yesNo = (value: boolean) => t(value ? 'adYes' : 'adNo');
  const adState = (state: 'idle' | 'loading' | 'loaded' | 'failed') =>
    t(
      state === 'loaded'
        ? 'adStateLoaded'
        : state === 'loading'
        ? 'adStateLoading'
        : state === 'failed'
        ? 'adStateFailed'
        : 'adStateIdle',
    );
  const purchase = async () => {
    try {
      await monetization.purchase();
    } catch (error) {
      const code = (error as {code?: string}).code;
      if (code !== 'USER_CANCELED') {
        Alert.alert(
          t('adsTitle'),
          t(code === 'PURCHASE_PENDING' ? 'purchasePending' : 'storeError'),
        );
      }
    }
  };
  const restore = async () => {
    try {
      await monetization.restore();
      // Native status events update the screen; an empty successful restore is
      // not a failure and does not claim that an entitlement was found.
      Alert.alert(t('restoreComplete'));
    } catch {
      Alert.alert(t('adsTitle'), t('storeError'));
    }
  };

  const option = (
    id: string,
    label: string,
    selected: boolean,
    onPress: () => void,
    hint?: string,
  ) => (
    <Pressable
      key={id}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{checked: selected}}
      onPress={onPress}
      android_ripple={{color: colors.outlineVariant}}
      style={({pressed}) => [
        styles.option,
        selected && styles.selectedOption,
        pressed && styles.pressedOption,
      ]}>
      <View style={styles.optionText}>
        <Text style={[styles.label, selected && styles.selectedText]}>
          {label}
        </Text>
        {hint && (
          <Text style={[styles.hint, selected && styles.selectedText]}>
            {hint}
          </Text>
        )}
      </View>
      <View
        accessible={false}
        pointerEvents="none"
        style={[styles.radio, selected && styles.selectedRadio]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.heading}>
          {t('appearance')}
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('appearance')}>
          {themeOptions.map(item =>
            option(
              item.value,
              t(item.label),
              preference === item.value,
              () => setPreference(item.value),
              t(item.hint),
            ),
          )}
        </View>
        <Text accessibilityRole="header" style={styles.heading}>
          {t('language')}
        </Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('language')}>
          {(['de', 'en'] as const).map(value =>
            option(
              value,
              t(value === 'de' ? 'german' : 'english'),
              language === value,
              () => setLanguage(value),
            ),
          )}
        </View>
        {monetization.available && (
          <>
            <Text accessibilityRole="header" style={styles.heading}>
              {t('adsTitle')}
            </Text>
            {monetization.adsRemoved ? (
              <Text accessibilityLiveRegion="polite" style={styles.label}>
                {t('adsRemoved')}
              </Text>
            ) : (
              <>
                <Text style={styles.hint}>{t('removeAdsHint')}</Text>
                <Button
                  label={
                    monetization.purchaseAvailable
                      ? `${t('removeAds')} (${monetization.price})`
                      : t('storeUnavailable')
                  }
                  variant="primary"
                  disabled={
                    monetization.busy || !monetization.purchaseAvailable
                  }
                  onPress={purchase}
                />
              </>
            )}
            <Button
              label={t('restorePurchases')}
              disabled={monetization.busy}
              onPress={restore}
            />
            {!monetization.adsRemoved && (
              <>
                <Text accessibilityRole="header" style={styles.heading}>
                  {t('adAgeTitle')}
                </Text>
                <Text style={styles.hint}>{t('adAgeHint')}</Text>
                <View
                  accessibilityRole="radiogroup"
                  accessibilityLabel={t('adAgeTitle')}>
                  {(['under16', 'teen', 'adult'] as const).map(group =>
                    option(
                      group,
                      t(
                        group === 'under16'
                          ? 'ageUnder16'
                          : group === 'teen'
                          ? 'ageTeen'
                          : 'ageAdult',
                      ),
                      monetization.ageGroup === group,
                      () => {
                        monetization
                          .setAgeGroup(group)
                          .catch(() =>
                            Alert.alert(t('adsTitle'), t('storeError')),
                          );
                      },
                    ),
                  )}
                </View>
                {monetization.privacyOptionsRequired && (
                  <Button
                    label={t('privacyOptions')}
                    disabled={monetization.busy}
                    onPress={() => {
                      monetization
                        .privacyOptions()
                        .catch(() =>
                          Alert.alert(t('adsTitle'), t('storeError')),
                        );
                    }}
                  />
                )}
              </>
            )}
            {diagnostics && (
              <>
                <Button
                  label={t(
                    diagnosticsOpen ? 'hideAdDiagnostics' : 'adDiagnostics',
                  )}
                  onPress={() => setDiagnosticsOpen(open => !open)}
                />
                {diagnosticsOpen && (
                  <View style={styles.diagnostics}>
                    <Text style={styles.hint}>{t('adDiagnosticsHint')}</Text>
                    <Text selectable style={styles.label}>
                      {[
                        `${t('adVersion')}: ${diagnostics.version}`,
                        `${t('adOwnership')}: ${yesNo(
                          monetization.purchaseChecked,
                        )}`,
                        `${t('adRequestsAllowed')}: ${yesNo(
                          monetization.adsReady,
                        )}`,
                        `${t('adConsentStatus')}: ${t(
                          diagnostics.consentBusy
                            ? 'adConsentChecking'
                            : diagnostics.consentStatus === 1
                            ? 'adConsentNotRequired'
                            : diagnostics.consentStatus === 2
                            ? 'adConsentRequired'
                            : diagnostics.consentStatus === 3
                            ? 'adConsentObtained'
                            : 'adConsentUnknown',
                        )}`,
                        `${t('adConsentForm')}: ${yesNo(
                          diagnostics.consentFormAvailable,
                        )}`,
                        `${t('adAgeProtection')}: ${yesNo(
                          diagnostics.ageProtected,
                        )}`,
                        `${t('adRating')}: ${diagnostics.adContentRating}`,
                        `${t('adBanner')}: ${adState(diagnostics.bannerState)}`,
                        `${t('adBannerSize')}: ${
                          diagnostics.bannerSize || '—'
                        }`,
                        `${t('adInterstitial')}: ${adState(
                          diagnostics.interstitialState,
                        )}`,
                        `${t('adBannerId')}: ${diagnostics.bannerId}`,
                      ].join('\n')}
                    </Text>
                    {(
                      [
                        ['adBillingError', diagnostics.billingError],
                        ['adConsentError', diagnostics.consentError],
                        ['adBannerError', diagnostics.bannerError],
                        ['adInterstitialError', diagnostics.interstitialError],
                      ] as [TranslationKey, string][]
                    )
                      .filter(([, message]) => message)
                      .map(([label, message]) => (
                        <Text key={label} selectable style={styles.hint}>
                          {t(label)}: {message}
                        </Text>
                      ))}
                    {!monetization.adsRemoved && (
                      <Button
                        label={t('retryAds')}
                        disabled={monetization.busy || diagnostics.consentBusy}
                        onPress={() => {
                          monetization.retryAds().catch(() => {});
                        }}
                      />
                    )}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    diagnostics: {
      gap: spacing.sm,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: radii.control,
    },
    screen: {flex: 1, backgroundColor: colors.background},
    content: {
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
      padding: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    heading: {color: colors.onSurface, fontSize: 20, fontWeight: '500'},
    option: {
      minHeight: 64,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: radii.control,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      overflow: 'hidden',
    },
    selectedOption: {backgroundColor: colors.primaryContainer},
    pressedOption: {backgroundColor: colors.surfaceContainerHigh},
    optionText: {flex: 1, gap: spacing.xs},
    label: {color: colors.onSurface, fontSize: 16, fontWeight: '500'},
    hint: {color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 21},
    selectedText: {color: colors.onPrimaryContainer},
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedRadio: {borderColor: colors.onPrimaryContainer},
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.onPrimaryContainer,
    },
  });

export default SettingsScreen;
