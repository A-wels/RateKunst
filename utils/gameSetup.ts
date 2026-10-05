import AsyncStorage from '@react-native-async-storage/async-storage';
import {CUSTOM_SET_INDEX_KEY} from './questionloader';

export const migrateSelectedPacks = (
  items: unknown,
  customIds: string[],
): string[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return [
    ...new Set(
      items
        .map(item => {
          if (item === 0) {
            return 'standard';
          }
          if (item === 1) {
            return 'movies-tv';
          }
          if (typeof item === 'number' && Number.isInteger(item) && item >= 2) {
            const id = customIds[item - 2];
            return id ? `custom:${id}` : null;
          }
          return typeof item === 'string' ? item : null;
        })
        .filter((item): item is string => item !== null),
    ),
  ];
};

const parse = (value: string | null): unknown => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const loadGameSetup = async () => {
  const [savedNames, savedPacks, savedPoints, savedCustomIds] =
    await Promise.all([
      AsyncStorage.getItem('names'),
      AsyncStorage.getItem('customSet'),
      AsyncStorage.getItem('pointsToWin'),
      AsyncStorage.getItem(CUSTOM_SET_INDEX_KEY),
    ]);
  const names = parse(savedNames);
  const customIds = parse(savedCustomIds);
  const points = Number(savedPoints);
  return {
    names: Array.isArray(names)
      ? names.filter((name): name is string => typeof name === 'string')
      : [],
    packIds: migrateSelectedPacks(
      parse(savedPacks),
      Array.isArray(customIds)
        ? customIds.filter((id): id is string => typeof id === 'string')
        : [],
    ),
    pointsToWin:
      Number.isInteger(points) && points > 0
        ? String(Math.min(999, points))
        : '10',
  };
};
