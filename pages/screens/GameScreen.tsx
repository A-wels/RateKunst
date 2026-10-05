import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';

import letters from '../../constants/letters';
import {getQuestions} from '../../utils/questionloader';
import {useLocalization} from '../../i18n/LocalizationContext';
import type {Language} from '../../i18n/LocalizationContext';
import {colors, radii, spacing} from '../../constants/theme';

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
  const [questionPool, setQuestionPool] = React.useState<string[]>([]);
  const [question, setQuestion] = React.useState('');
  const [letter, setLetter] = React.useState('');
  const [isCountingDown, setIsCountingDown] = React.useState(true);
  const recentQuestions = React.useRef<string[]>([]);
  const sequence = React.useRef(0);

  React.useEffect(() => {
    getQuestions(params.language).then(packs => {
      const selected = packs
        .filter(pack => params.packIds.includes(pack.id))
        .flatMap(pack => pack.questions)
        .filter(Boolean);
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
    setScoredThisTurn([]);

    for (const count of ['3', '2', '1']) {
      setQuestion(count);
      await delay(520);
      if (sequence.current !== currentSequence) {
        return;
      }
    }

    const recent = recentQuestions.current;
    const available = questionPool.filter(item => !recent.includes(item));
    const candidates = available.length > 0 ? available : questionPool;
    const nextQuestion =
      candidates[Math.floor(Math.random() * candidates.length)];
    const nextLetter = letters[Math.floor(Math.random() * letters.length)];

    recentQuestions.current = [...recent, nextQuestion].slice(
      -Math.min(20, Math.max(1, questionPool.length - 1)),
    );
    setQuestion(nextQuestion);
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
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={leaveGame}>
          <AntDesign name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.roundTitle}>
          <Text style={styles.logo}>{t('appName')}</Text>
          <Text style={styles.target}>
            {t('firstTo', {count: params.pointsToWin})}
          </Text>
        </View>
        <TouchableOpacity
          disabled={isCountingDown}
          style={[styles.skipButton, isCountingDown && styles.buttonDisabled]}
          onPress={loadNextQuestion}>
          <Text style={styles.skipText}>{t('skip')}</Text>
          <AntDesign name="arrowright" size={18} color={colors.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.gameArea}>
        <View style={styles.questionCard}>
          <Text style={styles.cardLabel}>{t('question').toUpperCase()}</Text>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            numberOfLines={3}
            style={styles.question}>
            {question}
          </Text>
        </View>
        <View style={styles.letterCard}>
          <Text style={styles.cardLabel}>{t('letter').toUpperCase()}</Text>
          <Text style={styles.letter}>{letter || '·'}</Text>
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
              <TouchableOpacity
                key={`${name}-${index}`}
                disabled={isCountingDown || alreadyScored}
                onPress={() => awardPoint(index)}
                style={[
                  styles.playerCard,
                  alreadyScored && styles.playerCardScored,
                ]}>
                <Text numberOfLines={1} style={styles.playerName}>
                  {name}
                </Text>
                <Text style={styles.score}>
                  {scores[index]}
                  <Text style={styles.scoreGoal}> / {params.pointsToWin}</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  topBar: {height: 58, flexDirection: 'row', alignItems: 'center'},
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roundTitle: {flex: 1, alignItems: 'center'},
  logo: {color: colors.text, fontSize: 21, fontWeight: '800'},
  target: {color: colors.textMuted, fontSize: 12, marginTop: 2},
  skipButton: {
    minWidth: 128,
    height: 44,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.warning,
  },
  skipText: {color: colors.black, fontSize: 14, fontWeight: '800'},
  buttonDisabled: {opacity: 0.45},
  gameArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  questionCard: {
    flex: 3,
    justifyContent: 'center',
    borderRadius: radii.large,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  letterCard: {
    flex: 1,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.large,
    padding: spacing.lg,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: '#28695F',
  },
  cardLabel: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  question: {
    color: colors.text,
    fontSize: 38,
    lineHeight: 45,
    fontWeight: '800',
    textAlign: 'center',
  },
  letter: {color: colors.accent, fontSize: 72, fontWeight: '900'},
  scoreArea: {height: 108},
  scoreHint: {color: colors.textMuted, fontSize: 11, marginBottom: spacing.sm},
  scoreRow: {gap: spacing.sm, paddingRight: spacing.md},
  playerCard: {
    width: 150,
    height: 78,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerCardScored: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  playerName: {
    maxWidth: '100%',
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  score: {color: colors.accent, fontSize: 23, fontWeight: '900', marginTop: 3},
  scoreGoal: {color: colors.textMuted, fontSize: 13, fontWeight: '600'},
});

export default GameScreen;
