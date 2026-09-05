import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';

import {CUSTOM_SET_INDEX_KEY} from '../../utils/questionloader';
import {useLocalization} from '../../i18n/LocalizationContext';
import {colors, radii, spacing} from '../../constants/theme';

const EditPage = ({route}: any) => {
  const {t} = useLocalization();
  const [setId] = React.useState<string>(
    () => route.params?.id ?? Date.now().toString(),
  );
  const [title, setTitle] = React.useState('');
  const [questionsText, setQuestionsText] = React.useState('');
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(setId)
      .then(value => {
        if (value) {
          const [storedTitle, ...storedQuestions]: string[] = JSON.parse(value);
          setTitle(storedTitle ?? '');
          setQuestionsText(storedQuestions.join('\n'));
        }
      })
      .finally(() => setHasLoaded(true));
  }, [setId]);

  React.useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    const questions = questionsText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    if (questions.length === 0) {
      return;
    }

    setIsSaving(true);
    const timeout = setTimeout(async () => {
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
      } finally {
        setIsSaving(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [hasLoaded, questionsText, setId, t, title]);

  const categoryCount = questionsText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean).length;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <AntDesign
              name={isSaving ? 'clockcircleo' : 'checkcircleo'}
              size={15}
              color={isSaving ? colors.warning : colors.accent}
            />
            <Text style={styles.statusText}>
              {t(isSaving ? 'saving' : 'saved')}
            </Text>
          </View>
          <Text style={styles.countText}>
            {t('categoryCount', {count: categoryCount})}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('setTitle')}</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder={t('setTitlePlaceholder')}
            placeholderTextColor={colors.textMuted}
            maxLength={60}
          />
        </View>

        <View style={[styles.fieldGroup, styles.questionsGroup]}>
          <View style={styles.questionLabelRow}>
            <Text style={styles.label}>{t('categories')}</Text>
            <Text style={styles.hint}>{t('categoriesHint')}</Text>
          </View>
          <TextInput
            style={styles.questionsInput}
            value={questionsText}
            onChangeText={setQuestionsText}
            placeholder={t('categoriesPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            autoCapitalize="sentences"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  statusText: {color: colors.textMuted, fontSize: 12, fontWeight: '700'},
  countText: {color: colors.textMuted, fontSize: 13},
  fieldGroup: {marginBottom: spacing.lg},
  questionsGroup: {flex: 1},
  questionLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  hint: {color: colors.textMuted, fontSize: 12},
  titleInput: {
    height: 54,
    paddingHorizontal: spacing.md,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  questionsInput: {
    minHeight: 330,
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
  },
});

export default EditPage;
