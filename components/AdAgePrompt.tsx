import React from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AgeGroup, useMonetization} from '../monetization/MonetizationContext';
import {useTheme} from '../theme/ThemeContext';
import {useLocalization} from '../i18n/LocalizationContext';
import Button from './Button';
import ForegroundModal from './ForegroundModal';

const AdAgePrompt = ({defer}: {defer: boolean}) => {
  const {available, ageGroup, adsRemoved, setAgeGroup, busy} =
    useMonetization();
  const {colors} = useTheme();
  const {t} = useLocalization();
  const [dismissed, setDismissed] = React.useState(false);
  const select = async (group: AgeGroup) => {
    try {
      await setAgeGroup(group);
    } catch {
      Alert.alert(t('adsTitle'), t('storeError'));
    }
  };
  return (
    <ForegroundModal
      visible={available && !ageGroup && !adsRemoved && !defer && !dismissed}
      onRequestClose={() => setDismissed(true)}>
      <SafeAreaView
        style={[styles.screen, {backgroundColor: colors.background}]}>
        <View style={styles.content}>
          <Text
            accessibilityRole="header"
            style={[styles.title, {color: colors.onSurface}]}>
            {t('adAgeTitle')}
          </Text>
          <Text style={[styles.body, {color: colors.onSurfaceVariant}]}>
            {t('adAgeHint')}
          </Text>
          <Button
            label={t('ageUnder16')}
            disabled={busy}
            onPress={() => select('under16')}
          />
          <Button
            label={t('ageTeen')}
            disabled={busy}
            onPress={() => select('teen')}
          />
          <Button
            label={t('ageAdult')}
            disabled={busy}
            onPress={() => select('adult')}
          />
          <Button
            label={t('later')}
            variant="text"
            disabled={busy}
            onPress={() => setDismissed(true)}
          />
        </View>
      </SafeAreaView>
    </ForegroundModal>
  );
};
const styles = StyleSheet.create({
  screen: {flex: 1, justifyContent: 'center'},
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: 24,
    gap: 16,
  },
  title: {fontSize: 24, fontWeight: '500'},
  body: {fontSize: 16, lineHeight: 24},
});
export default AdAgePrompt;
