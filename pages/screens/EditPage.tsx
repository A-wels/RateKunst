import ScrollView from '../../components/RecoverableScrollView';
import React from 'react';
import {useTheme, useThemedStyles} from '../../theme/ThemeContext';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';

import {CUSTOM_SET_INDEX_KEY} from '../../utils/questionloader';
import {useLocalization} from '../../i18n/LocalizationContext';
import {ThemeColors, radii, spacing} from '../../constants/theme';

const EditPage = ({route}: any) => {
  const {t} = useLocalization();
  const {colors} = useTheme();
  const styles = useThemedStyles(createStyles);
  const [setId] = React.useState<string>(
    () =>
      route.params?.id ??
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const [title, setTitle] = React.useState('');
  const [questionsText, setQuestionsText] = React.useState('');
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveFailed, setSaveFailed] = React.useState(false);
  const dirty = React.useRef(false);
  const active = React.useRef(true);
  const revision = React.useRef(0);
  const saveQueue = React.useRef<Promise<void>>(Promise.resolve());

  React.useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  React.useEffect(() => {
    AsyncStorage.getItem(setId)
      .then(value => {
        if (!active.current) {
          return;
        }
        if (value) {
          const [storedTitle, ...storedQuestions]: string[] = JSON.parse(value);
          setTitle(storedTitle ?? '');
          setQuestionsText(storedQuestions.join('\n'));
        }
        setHasLoaded(true);
      })
      .catch(error => {
        console.warn('Could not load custom pack', error);
        if (active.current) {
          setSaveFailed(true);
        }
      });
  }, [setId]);

  React.useEffect(() => {
    if (!hasLoaded || !dirty.current) {
      return;
    }

    const questions = questionsText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    const currentRevision = ++revision.current;
    setIsSaving(true);
    setSaveFailed(false);
    // Serialize writes and do not cancel them on navigation. The last edit must
    // reach storage even when the user immediately leaves the editor.
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        const finalTitle = title.trim() || t('untitledSet');
        const storedIds = await AsyncStorage.getItem(CUSTOM_SET_INDEX_KEY);
        const ids: string[] = storedIds ? JSON.parse(storedIds) : [];
        await Promise.all([
          AsyncStorage.setItem(
            setId,
            JSON.stringify([finalTitle, ...questions]),
          ),
          AsyncStorage.setItem(
            CUSTOM_SET_INDEX_KEY,
            JSON.stringify(ids.includes(setId) ? ids : [...ids, setId]),
          ),
        ]);
      } catch (error) {
        console.warn('Could not save custom pack', error);
        if (active.current && revision.current === currentRevision) {
          setSaveFailed(true);
        }
      } finally {
        if (active.current && revision.current === currentRevision) {
          setIsSaving(false);
        }
      }
    });
  }, [hasLoaded, questionsText, setId, t, title]);

  const questionCount = questionsText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean).length;

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.statusRow}>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.statusText, saveFailed && styles.failedText]}>
              {t(
                saveFailed
                  ? 'saveFailed'
                  : !hasLoaded || isSaving
                  ? 'saving'
                  : 'saved',
              )}
            </Text>
            <Text style={styles.countText}>
              {t('questionCount', {count: questionCount})}
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('setTitle')}</Text>
            <TextInput
              selectionColor={colors.primary}
              accessibilityLabel={t('setTitle')}
              style={styles.titleInput}
              value={title}
              editable={hasLoaded}
              onChangeText={value => {
                dirty.current = true;
                setTitle(value);
              }}
              placeholder={t('setTitlePlaceholder')}
              placeholderTextColor={colors.onSurfaceVariant}
              maxLength={60}
            />
          </View>

          <View style={[styles.fieldGroup, styles.questionsGroup]}>
            <View style={styles.questionLabelRow}>
              <Text style={styles.label}>{t('questions')}</Text>
              <Text style={styles.hint}>{t('questionsHint')}</Text>
            </View>
            <TextInput
              selectionColor={colors.primary}
              accessibilityLabel={t('questions')}
              accessibilityHint={t('questionsHint')}
              style={styles.questionsInput}
              value={questionsText}
              editable={hasLoaded}
              onChangeText={value => {
                dirty.current = true;
                setQuestionsText(value);
              }}
              placeholder={t('questionsPlaceholder')}
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {flex: 1, backgroundColor: colors.background},
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
      padding: spacing.md,
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statusText: {color: colors.onSurfaceVariant, fontSize: 14},
    failedText: {color: colors.error},
    countText: {color: colors.onSurfaceVariant, fontSize: 14},
    fieldGroup: {marginBottom: spacing.lg},
    questionsGroup: {flex: 1},
    questionLabelRow: {marginBottom: spacing.sm},
    label: {
      color: colors.onSurface,
      fontSize: 16,
      fontWeight: '500',
      marginBottom: spacing.sm,
    },
    hint: {color: colors.onSurfaceVariant, fontSize: 14},
    titleInput: {
      minHeight: 48,
      paddingHorizontal: 12,
      borderRadius: radii.control,
      borderWidth: 1,
      borderColor: colors.outline,
      color: colors.onSurface,
      fontSize: 16,
    },
    questionsInput: {
      minHeight: 300,
      flex: 1,
      padding: 12,
      borderRadius: radii.control,
      borderWidth: 1,
      borderColor: colors.outline,
      color: colors.onSurface,
      fontSize: 16,
      lineHeight: 25,
    },
  });

export default EditPage;
