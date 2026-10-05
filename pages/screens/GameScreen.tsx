import React from 'react';
import {
  Alert,
  StatusBar,
  ScrollView,
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
import {colors, radii, spacing} from '../../constants/theme';

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

  const awardPoint = (index: number) => {
    if (isCountingDown || scoredThisTurn.includes(index)) {
      return;
    }

    const updatedScores = scores.map((score, scoreIndex) =>
      scoreIndex === index ? score + 1 : score,
    );
    setScores(updatedScores);
    setScoredThisTurn(current => [...current, index]);

    if (updatedScores[index] >= params.pointsToWin) {
      Alert.alert(
        t('winnerTitle'),
        t('winnerMessage', {name: params.names[index]}),
        [{text: t('backToMenu'), onPress: () => navigation.popToTop()}],
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
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
          <FittedText fontSize={72} color={colors.letter} singleLine>
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
                accessibilityHint={t('tapScore')}
                accessibilityState={{disabled: isCountingDown || alreadyScored}}
                android_ripple={{color: colors.border}}
                key={`${name}-${index}`}
                disabled={isCountingDown || alreadyScored}
                onPress={() => awardPoint(index)}
                style={({pressed}) => [
                  styles.playerButton,
                  alreadyScored && styles.playerButtonScored,
                  pressed && styles.playerButtonPressed,
                ]}>
                <Text numberOfLines={1} style={styles.playerName}>
                  {name}
                </Text>
                <Text style={styles.score}>
                  {scores[index]}
                  <Text style={styles.scoreGoal}> / {params.pointsToWin}</Text>
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background, padding: spacing.sm},
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roundTitle: {flex: 1, alignItems: 'center'},
  target: {color: colors.textMuted, fontSize: 14, textAlign: 'center'},
  gameArea: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  questionPanel: {
    flex: 3,
    backgroundColor: colors.questionSurface,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  letterPanel: {
    flex: 1,
    backgroundColor: colors.letterSurface,
    borderRadius: radii.control,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  scoreArea: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  scoreHint: {color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm},
  scoreRow: {gap: spacing.sm, paddingRight: spacing.sm},
  playerButton: {
    backgroundColor: colors.playerSurface,
    borderTopColor: colors.playerEdge,
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
    backgroundColor: colors.primarySoft,
    borderTopColor: colors.primary,
  },
  playerButtonPressed: {backgroundColor: colors.border},
  playerName: {maxWidth: '100%', color: colors.text, fontSize: 16},
  score: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  scoreGoal: {color: colors.textMuted, fontSize: 14, fontWeight: '400'},
});

export default GameScreen;
