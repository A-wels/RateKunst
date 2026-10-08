import ScrollView from '../../components/RecoverableScrollView';
import React from 'react';
import {useMonetization} from '../../monetization/MonetizationContext';
import {useTheme, useThemedStyles} from '../../theme/ThemeContext';
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from '../../components/Button';
import FittedText from '../../components/FittedText';

import letters from '../../constants/letters';
import {getQuestions} from '../../utils/questionloader';
import {useLocalization} from '../../i18n/LocalizationContext';
import type {Language} from '../../i18n/LocalizationContext';
import {ThemeColors, radii, spacing} from '../../constants/theme';

type RoundQuestion = {text: string; setTitle: string};

type GameParams = {
  names: string[];
  packIds: string[];
  pointsToWin: number;
  language: Language;
};

const delay = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

const GameScreen = ({navigation, route}: any) => {
  const {t} = useLocalization();
  const {completeRound, restartRound} = useMonetization();
  const finished = React.useRef(false);
  const mounted = React.useRef(true);
  const roundEnded = React.useRef(false);
  const {colors, mode} = useTheme();
  const styles = useThemedStyles(createStyles);
  const params = route.params as GameParams;
  const [scores, setScores] = React.useState<number[]>(() =>
    params.names.map(() => 0),
  );
  const [scoredThisTurn, setScoredThisTurn] = React.useState<number[]>([]);
  const [questionPool, setQuestionPool] = React.useState<RoundQuestion[]>([]);
  const [question, setQuestion] = React.useState('');
  const [setTitle, setSetTitle] = React.useState('');
  const [letter, setLetter] = React.useState('');
  const [isCountingDown, setIsCountingDown] = React.useState(true);
  const recentQuestions = React.useRef<string[]>([]);
  const sequence = React.useRef(0);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    getQuestions(params.language).then(packs => {
      const selected = packs
        .filter(pack => params.packIds.includes(pack.id))
        .flatMap(pack =>
          pack.questions
            .filter(Boolean)
            .map(text => ({text, setTitle: pack.title})),
        );
      setQuestionPool(selected);
    });
    return () => {
      sequence.current += 1;
    };
  }, [params.language, params.packIds]);

  const loadNextQuestion = React.useCallback(async () => {
    if (questionPool.length === 0 || isCountingDown) {
      return;
    }

    const currentSequence = ++sequence.current;
    setIsCountingDown(true);
    setLetter('');
    setSetTitle('');
    setScoredThisTurn([]);

    for (const count of ['3', '2', '1']) {
      setQuestion(count);
      await delay(520);
      if (sequence.current !== currentSequence) {
        return;
      }
    }

    const recent = recentQuestions.current;
    const available = questionPool.filter(item => !recent.includes(item.text));
    const candidates = available.length > 0 ? available : questionPool;
    const nextQuestion =
      candidates[Math.floor(Math.random() * candidates.length)];
    const nextLetter = letters[Math.floor(Math.random() * letters.length)];

    recentQuestions.current = [...recent, nextQuestion.text].slice(
      -Math.min(20, Math.max(1, questionPool.length - 1)),
    );
    setQuestion(nextQuestion.text);
    setSetTitle(nextQuestion.setTitle);
    setLetter(nextLetter);
    setIsCountingDown(false);
  }, [isCountingDown, questionPool]);

  React.useEffect(() => {
    if (questionPool.length > 0) {
      setIsCountingDown(false);
    }
  }, [questionPool]);

  React.useEffect(() => {
    if (!isCountingDown && question === '' && questionPool.length > 0) {
      loadNextQuestion();
    }
  }, [isCountingDown, loadNextQuestion, question, questionPool.length]);

  const removePoint = (index: number) => {
    if (roundEnded.current) {
      return;
    }
    setScores(current =>
      current.map((score, scoreIndex) =>
        scoreIndex === index ? Math.max(0, score - 1) : score,
      ),
    );
    setScoredThisTurn(current => current.filter(player => player !== index));
  };

  const awardPoint = (index: number) => {
    if (
      roundEnded.current ||
      isCountingDown ||
      scoredThisTurn.includes(index)
    ) {
      return;
    }

    const updatedScores = scores.map((score, scoreIndex) =>
      scoreIndex === index ? score + 1 : score,
    );
    setScores(updatedScores);
    setScoredThisTurn(current => [...current, index]);

    if (updatedScores[index] >= params.pointsToWin) {
      roundEnded.current = true;
      Alert.alert(
        t('winnerTitle'),
        t('winnerMessage', {name: params.names[index]}),
        [
          {
            text: t('backToMenu'),
            onPress: () => {
              if (finished.current) {
                return;
              }
              finished.current = true;
              completeRound();
              navigation.popToTop();
            },
          },
          {
            text: t('restart'),
            onPress: async () => {
              if (finished.current) {
                return;
              }
              finished.current = true;
              await restartRound();
              if (mounted.current) {
                navigation.replace('Game', params);
              }
            },
          },
        ],
        {cancelable: false},
      );
    } else {
      setIsCountingDown(false);
      loadNextQuestion();
    }
  };

  const leaveGame = () =>
    Alert.alert(t('leaveGameTitle'), t('leaveGameMessage'), [
      {text: t('stay'), style: 'cancel'},
      {
        text: t('leave'),
        style: 'destructive',
        onPress: () => navigation.popToTop(),
      },
    ]);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
      />
      <View style={styles.topBar}>
        <Button label={t('leave')} variant="text" onPress={leaveGame} />
        <View style={styles.roundTitle}>
          <Text style={styles.target}>
            {t('scoreTarget', {count: params.pointsToWin})}
          </Text>
        </View>
        <Button
          label={t('skip')}
          disabled={isCountingDown}
          onPress={loadNextQuestion}
        />
      </View>

      <View style={styles.gameArea}>
        <View style={styles.questionPanel}>
          <Text style={styles.label} numberOfLines={2}>
            {setTitle}
          </Text>
          <FittedText fontSize={38}>{question}</FittedText>
        </View>
        <View style={styles.letterPanel}>
          <Text style={styles.label}>{t('letter')}</Text>
          <FittedText
            fontSize={72}
            color={colors.onPrimaryContainer}
            singleLine>
            {letter}
          </FittedText>
        </View>
      </View>

      <View style={styles.scoreArea}>
        <Text style={styles.scoreHint}>{t('tapScore')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scoreRow}>
          {params.names.map((name, index) => {
            const alreadyScored = scoredThisTurn.includes(index);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('playerScore', {
                  name,
                  score: scores[index],
                  target: params.pointsToWin,
                })}
                accessibilityHint={t('scoreActionsHint')}
                accessibilityState={{disabled: roundEnded.current}}
                accessibilityActions={
                  scores[index] > 0 && !roundEnded.current
                    ? [{name: 'decrement', label: t('removePoint')}]
                    : []
                }
                onAccessibilityAction={event => {
                  if (event.nativeEvent.actionName === 'decrement') {
                    removePoint(index);
                  }
                }}
                android_ripple={{color: colors.outlineVariant}}
                key={`${name}-${index}`}
                disabled={roundEnded.current}
                onPress={() => awardPoint(index)}
                onLongPress={() => removePoint(index)}
                style={({pressed}) => [
                  styles.playerButton,
                  alreadyScored && styles.playerButtonScored,
                  pressed && styles.playerButtonPressed,
                ]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.playerName,
                    alreadyScored && {color: colors.onPrimaryContainer},
                  ]}>
                  {name}
                </Text>
                <Text
                  style={[
                    styles.score,
                    alreadyScored && {color: colors.onPrimaryContainer},
                  ]}>
                  {scores[index]}
                  <Text
                    style={[
                      styles.scoreGoal,
                      alreadyScored && {color: colors.onPrimaryContainer},
                    ]}>
                    {' '}
                    / {params.pointsToWin}
                  </Text>
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {flex: 1, backgroundColor: colors.background, padding: spacing.sm},
    topBar: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    roundTitle: {flex: 1, alignItems: 'center'},
    target: {color: colors.onSurfaceVariant, fontSize: 14, textAlign: 'center'},
    gameArea: {
      flex: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    questionPanel: {
      flex: 3,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: radii.control,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    letterPanel: {
      flex: 1,
      backgroundColor: colors.primaryContainer,
      borderRadius: radii.control,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    label: {
      color: colors.onSurfaceVariant,
      fontSize: 14,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    scoreArea: {
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
      paddingTop: spacing.sm,
    },
    scoreHint: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
      marginBottom: spacing.sm,
    },
    scoreRow: {gap: spacing.sm, paddingRight: spacing.sm},
    playerButton: {
      backgroundColor: colors.secondaryContainer,
      borderTopColor: colors.secondary,
      width: 152,
      minHeight: 72,
      padding: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.control,
      borderTopWidth: 3,
      overflow: 'hidden',
    },
    playerButtonScored: {
      backgroundColor: colors.primaryContainer,
      borderTopColor: colors.primary,
    },
    playerButtonPressed: {backgroundColor: colors.outlineVariant},
    playerName: {
      maxWidth: '100%',
      color: colors.onSecondaryContainer,
      fontSize: 16,
    },
    score: {
      color: colors.onSecondaryContainer,
      fontSize: 24,
      fontWeight: '500',
      marginTop: spacing.xs,
    },
    scoreGoal: {
      color: colors.onSecondaryContainer,
      fontSize: 14,
      fontWeight: '400',
    },
  });

export default GameScreen;
