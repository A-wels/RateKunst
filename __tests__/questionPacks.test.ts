import {
  builtInPackIds,
  getBuiltInQuestionPacks,
} from '../constants/questionPacks';
import {expect, it} from '@jest/globals';

it('provides playable, duplicate-free packs with matching language entries', () => {
  const german = getBuiltInQuestionPacks('de');
  const english = getBuiltInQuestionPacks('en');
  expect(german.map(pack => pack.id)).toEqual(builtInPackIds);
  expect(english.map(pack => pack.id)).toEqual(builtInPackIds);
  expect(new Set(builtInPackIds).size).toBe(builtInPackIds.length);
  german.forEach((pack, index) => {
    expect(pack.questions).toHaveLength(english[index].questions.length);
    for (const localized of [pack, english[index]]) {
      expect(localized.questions.length).toBeGreaterThan(0);
      expect(localized.questions.every(text => text.trim().length > 0)).toBe(
        true,
      );
      expect(
        new Set(localized.questions.map(text => text.trim().toLowerCase()))
          .size,
      ).toBe(localized.questions.length);
    }
  });
});

it('does not let a caller modify the built-in question pool', () => {
  const packs = getBuiltInQuestionPacks('de');
  const original = [...packs[0].questions];
  packs[0].questions.length = 0;
  expect(getBuiltInQuestionPacks('de')[0].questions).toEqual(original);
});
