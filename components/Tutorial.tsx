import React from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, spacing} from '../constants/theme';
import {useLocalization, TranslationKey} from '../i18n/LocalizationContext';
import Button from './Button';
import FittedText from './FittedText';

type Props = {visible: boolean; onClose: () => void};
const steps: {title: TranslationKey; body: TranslationKey}[] = [
  {title: 'tutorialSetupTitle', body: 'tutorialSetupBody'},
  {title: 'tutorialAnswerTitle', body: 'tutorialAnswerBody'},
  {title: 'tutorialScoreTitle', body: 'tutorialScoreBody'},
  {title: 'tutorialPacksTitle', body: 'tutorialPacksBody'},
];

const Tutorial = ({visible, onClose}: Props) => {
  const {t} = useLocalization();
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    if (visible) {
      setStep(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        {visible && (
          <StatusBar
            barStyle="dark-content"
            backgroundColor={colors.background}
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
                      {t('tutorialCategory')}
                    </FittedText>
                  </View>
                  <View style={styles.exampleLetter}>
                    <Text style={styles.exampleLabel}>{t('letter')}</Text>
                    <FittedText fontSize={64} color={colors.letter} singleLine>
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
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  progress: {flex: 1, color: colors.textMuted, fontSize: 14},
  body: {paddingVertical: spacing.lg, gap: spacing.lg},
  title: {color: colors.text, fontSize: 24, lineHeight: 32, fontWeight: '500'},
  description: {color: colors.text, fontSize: 16, lineHeight: 25},
  example: {
    height: 160,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exampleQuestion: {
    flex: 2,
    padding: spacing.md,
    backgroundColor: colors.questionSurface,
  },
  exampleLetter: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.letterSurface,
  },
  exampleLabel: {
    color: colors.textMuted,
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
