import ScrollView from './RecoverableScrollView';
import React from 'react';
import AdBanner from './AdBanner';
import {useTheme, useThemedStyles} from '../theme/ThemeContext';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ThemeColors, spacing} from '../constants/theme';
import {useLocalization, TranslationKey} from '../i18n/LocalizationContext';
import Button from './Button';
import FittedText from './FittedText';
import ForegroundModal from './ForegroundModal';

type Props = {visible: boolean; onClose: () => void};
const steps: {title: TranslationKey; body: TranslationKey}[] = [
  {title: 'tutorialSetupTitle', body: 'tutorialSetupBody'},
  {title: 'tutorialAnswerTitle', body: 'tutorialAnswerBody'},
  {title: 'tutorialScoreTitle', body: 'tutorialScoreBody'},
  {title: 'tutorialPacksTitle', body: 'tutorialPacksBody'},
];

const Tutorial = ({visible, onClose}: Props) => {
  const {t} = useLocalization();
  const {colors, mode} = useTheme();
  const styles = useThemedStyles(createStyles);
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    if (visible) {
      setStep(0);
    }
  }, [visible]);

  return (
    <ForegroundModal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        {visible && (
          <StatusBar
            barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
              />
        )}
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Text style={styles.progress}>
              {t('tutorialStep', {current: step + 1, total: steps.length})}
            </Text>
            <Button
              label={t('skipTutorial')}
              variant="text"
              onPress={onClose}
            />
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            <Text
              accessibilityRole="header"
              accessibilityLiveRegion="polite"
              style={styles.title}>
              {t(steps[step].title)}
            </Text>
            <Text style={styles.description}>{t(steps[step].body)}</Text>
            {step === 1 && (
              <>
                <View style={styles.example}>
                  <View style={styles.exampleQuestion}>
                    <Text style={styles.exampleLabel}>{t('question')}</Text>
                    <FittedText fontSize={32}>
                      {t('tutorialQuestion')}
                    </FittedText>
                  </View>
                  <View style={styles.exampleLetter}>
                    <Text style={styles.exampleLabel}>{t('letter')}</Text>
                    <FittedText
                      fontSize={64}
                      color={colors.onPrimaryContainer}
                      singleLine>
                      B
                    </FittedText>
                  </View>
                </View>
                <Text style={styles.description}>{t('tutorialExample')}</Text>
              </>
            )}
          </ScrollView>
          <View style={styles.actions}>
            {step > 0 && (
              <Button
                label={t('previous')}
                variant="text"
                onPress={() => setStep(current => current - 1)}
              />
            )}
            <View style={styles.next}>
              <Button
                label={t(step === steps.length - 1 ? 'finishTutorial' : 'next')}
                variant="primary"
                onPress={() =>
                  step === steps.length - 1
                    ? onClose()
                    : setStep(current => current + 1)
                }
              />
            </View>
          </View>
        </View>
        <AdBanner />
      </SafeAreaView>
    </ForegroundModal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {flex: 1, backgroundColor: colors.background},
    content: {
      flex: 1,
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
      padding: spacing.md,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    progress: {flex: 1, color: colors.onSurfaceVariant, fontSize: 14},
    body: {paddingVertical: spacing.lg, gap: spacing.lg},
    title: {
      color: colors.onSurface,
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '500',
    },
    description: {color: colors.onSurface, fontSize: 16, lineHeight: 25},
    example: {
      height: 160,
      flexDirection: 'row',
      gap: spacing.sm,
    },
    exampleQuestion: {
      flex: 2,
      padding: spacing.md,
      backgroundColor: colors.surfaceContainerLow,
    },
    exampleLetter: {
      flex: 1,
      padding: spacing.md,
      backgroundColor: colors.primaryContainer,
    },
    exampleLabel: {
      color: colors.onSurfaceVariant,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.md,
    },
    next: {flex: 1},
  });

export default Tutorial;
