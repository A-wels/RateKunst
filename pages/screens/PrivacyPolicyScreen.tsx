import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScrollView from '../../components/RecoverableScrollView';
import policy from '../../assets/privacy-policy.json';
import {ThemeColors, spacing} from '../../constants/theme';
import {useLocalization} from '../../i18n/LocalizationContext';
import {useThemedStyles} from '../../theme/ThemeContext';

const PrivacyPolicyScreen = () => {
  const {language} = useLocalization();
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text selectable style={styles.body}>
          08.10.2026 · de.awels.ratekunst
        </Text>
        {policy.sections[language].map((block, index) => (
          <Text
            key={index}
            selectable
            accessibilityRole={
              block.kind.startsWith('h') ? 'header' : undefined
            }
            style={block.kind.startsWith('h') ? styles.heading : styles.body}>
            {block.kind === 'li' ? '• ' : ''}
            {block.text}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {flex: 1, backgroundColor: colors.background},
    content: {
      width: '100%',
      maxWidth: 720,
      alignSelf: 'center',
      padding: spacing.md,
      gap: spacing.md,
    },
    heading: {
      color: colors.onSurface,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '500',
      marginTop: spacing.sm,
    },
    body: {color: colors.onSurface, fontSize: 15, lineHeight: 23},
  });
export default PrivacyPolicyScreen;
