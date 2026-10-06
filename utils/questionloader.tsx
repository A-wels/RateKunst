import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBuiltInQuestionPacks,
  QuestionPack,
} from '../constants/questionPacks';
import type {Language} from '../i18n/LocalizationContext';

export const CUSTOM_SET_INDEX_KEY = '@customSets';

export const getQuestions = async (
  language: Language,
): Promise<QuestionPack[]> => {
  const packs = getBuiltInQuestionPacks(language);

  try {
    const value = await AsyncStorage.getItem(CUSTOM_SET_INDEX_KEY);
    const ids: string[] = value ? JSON.parse(value) : [];

    for (const id of ids) {
      const storedSet = await AsyncStorage.getItem(id);
      if (!storedSet) {
        continue;
      }

      const parsedSet: string[] = JSON.parse(storedSet);
      const [title, ...questions] = parsedSet;
      if (title && questions.length > 0) {
        packs.push({id: `custom:${id}`, title, questions, custom: true});
      }
    }
  } catch (error) {
    console.warn('Could not load custom question packs', error);
  }

  return packs;
};

export const getQuestionLabels = async (language: Language) => {
  const questions = await getQuestions(language);
  return questions.map(pack => ({label: pack.title, value: pack.id}));
};

export const getCustomSetStorageId = (packId: string) =>
  packId.startsWith('custom:') ? packId.slice('custom:'.length) : packId;
