import {
  builtInPackIds,
  getBuiltInQuestionPacks,
} from '../constants/questionPacks';
import {describe, expect, it} from '@jest/globals';

describe('built-in question packs', () => {
  it('provides ten stable and unique packs', () => {
    expect(builtInPackIds).toHaveLength(10);
    expect(new Set(builtInPackIds).size).toBe(builtInPackIds.length);
    expect(builtInPackIds).toEqual([
      'standard',
      'movies-tv',
      'everyday-chaos',
      'fantasy-rpg',
      'gaming-nerd',
      'party-dark-humor',
      'nature-animals',
      'knowledge-science',
      'food-drinks',
      'travel-places',
    ]);
  });

  it.each(['de', 'en'] as const)(
    'has localized titles and substantial question lists in %s',
    language => {
      const packs = getBuiltInQuestionPacks(language);
      expect(packs).toHaveLength(10);

      for (const pack of packs) {
        expect(pack.title.trim()).not.toBe('');
        expect(pack.questions.length).toBeGreaterThanOrEqual(40);
        expect(
          pack.questions.every(question => question === question.trim()),
        ).toBe(true);
        expect(new Set(pack.questions).size).toBe(pack.questions.length);
      }
    },
  );
});
