const { test, expect } = require("@jest/globals");
const {
  isUrl,
  uuidV4Pattern,
  apiKeyPattern,
  allXBetTypePattern,
  mixNBetTypePattern,
  systemBetTypePattern,
  nDirectBetTypePattern,
  anacondaNBetTypePattern,
  colourOverBetTypePattern,
  mostColourBetTypePattern,
  time_pattern: timePattern,
  colourRatioBetTypePattern,
  absoluteAllXBetTypePattern,
  firstOrLastNBallOverUnderBetTypePattern,
  firstOrLastSingleOrDoubleBetTypePattern,
  even_odd_bet_type_pattern: evenOddBetTypePattern,
  n_against_bet_type_pattern: nAgainstBetTypePattern,
  over_under_bet_type_pattern: overUnderBetTypePattern,
  permutation_bet_type_pattern: permutationBetTypePattern,
  selection_joined_with_dashes_pattern: selectionJoinedWithDashesPattern,
} = require("./PatternTemplates");

describe('Pattern tests', () => {
  test('Time string pattern', () => {
    expect(timePattern).toBeDefined();
    expect('20:18:00').toMatch(timePattern);
    expect('0:18').toMatch(timePattern);
    expect('118:00').not.toMatch(timePattern);
  });

  test('API key pattern', () => {
    expect(apiKeyPattern).toBeDefined();
    expect('USR.HvumDQ-vwJY1n-euHuLb-Zz1V3G-TEST-cq').toMatch(apiKeyPattern);
    expect('MOB.HvumDQ-vwJY1n-euHuLb-Zz1V3G-TEST-cq').toMatch(apiKeyPattern);
    expect('VVS.HvumDQ-vwJY1n').not.toMatch(apiKeyPattern);
  });

  test('UUID V4 pattern', () => {
    expect(uuidV4Pattern).toBeDefined();
    expect('1a6ed375-3a95-4b1f-bda7-5450acb162c0').toMatch(uuidV4Pattern);
    expect('ac59d628-0d41-431a-a804-24d92c370029').toMatch(uuidV4Pattern);
    expect('ac59d628-0d41-431a-a80-24d92c370029').not.toMatch(uuidV4Pattern);
  });

  test('Selections pattern', () => {
    expect(selectionJoinedWithDashesPattern).toBeDefined();
    expect('12').toMatch(selectionJoinedWithDashesPattern);
    expect('029-12').toMatch(selectionJoinedWithDashesPattern);
    expect('09/12').toMatch(selectionJoinedWithDashesPattern);
    expect('09,12').not.toMatch(selectionJoinedWithDashesPattern);
  });

  test('Permutation pattern', () => {
    expect(permutationBetTypePattern).toBeDefined();
    expect('permutation-2').toMatch(permutationBetTypePattern);
    expect('permutation-14').toMatch(permutationBetTypePattern);
    expect('permutation-10').toMatch(permutationBetTypePattern);
    expect('perm-12').not.toMatch(permutationBetTypePattern);
    expect('permutation-101').not.toMatch(permutationBetTypePattern);
  });

  test('System Bet type pattern', () => {
    expect(systemBetTypePattern).toBeDefined();
    expect('system').toMatch(systemBetTypePattern);
    expect('system-2').not.toMatch(systemBetTypePattern);
    expect('system2').not.toMatch(systemBetTypePattern);
  });

  test('All-X pattern', () => {
    expect(allXBetTypePattern).toBeDefined();
    expect('all-2').toMatch(allXBetTypePattern);
    expect('all-11').toMatch(allXBetTypePattern);
    expect('all-12*').not.toMatch(allXBetTypePattern);
    expect('*all-10').not.toMatch(allXBetTypePattern);
  });

  test('Absolute All-X pattern', () => {
    expect(absoluteAllXBetTypePattern).toBeDefined();
    expect('*all-2*').toMatch(absoluteAllXBetTypePattern);
    expect('*all-11*').toMatch(absoluteAllXBetTypePattern);
    expect('all-12*').not.toMatch(absoluteAllXBetTypePattern);
    expect('*all-10').not.toMatch(absoluteAllXBetTypePattern);
    expect('all-10').not.toMatch(absoluteAllXBetTypePattern);
  });

  test('Over/under pattern', () => {
    expect(overUnderBetTypePattern).toBeDefined();
    expect('over').toMatch(overUnderBetTypePattern);
    expect('under').toMatch(overUnderBetTypePattern);
    expect('dedr').not.toMatch(overUnderBetTypePattern);
  });

  test('N-against/Banker-against pattern', () => {
    expect(nAgainstBetTypePattern).toBeDefined();
    expect('banker-against-all').toMatch(nAgainstBetTypePattern);
    expect('banker-against').toMatch(nAgainstBetTypePattern);
    expect('2-against').toMatch(nAgainstBetTypePattern);
    expect('3against').not.toMatch(nAgainstBetTypePattern);
  });

  test('Even/Odd pattern', () => {
    expect(evenOddBetTypePattern).toBeDefined();
    expect('most-even').toMatch(evenOddBetTypePattern);
    expect('1st-odd').toMatch(evenOddBetTypePattern);
    expect('last-2-odd').toMatch(evenOddBetTypePattern);
    expect('1st-or-last-even').toMatch(evenOddBetTypePattern);
    expect('1st-or-last-balls-over').not.toMatch(evenOddBetTypePattern);
  });

  test('N-Ball Over/Under pattern', () => {
    expect(firstOrLastNBallOverUnderBetTypePattern).toBeDefined();
    expect('last-2-balls-over').toMatch(firstOrLastNBallOverUnderBetTypePattern);
    expect('1st-or-last-balls-under').toMatch(firstOrLastNBallOverUnderBetTypePattern);
    expect('last-balls-under').toMatch(firstOrLastNBallOverUnderBetTypePattern);
    expect('1st-5-over').not.toMatch(firstOrLastNBallOverUnderBetTypePattern);
  });

  test('1st/Last Single/Double pattern', () => {
    expect(firstOrLastSingleOrDoubleBetTypePattern).toBeDefined();
    expect('last-single').toMatch(firstOrLastSingleOrDoubleBetTypePattern);
    expect('1st-not-double').toMatch(firstOrLastSingleOrDoubleBetTypePattern);
    expect('last-double').toMatch(firstOrLastSingleOrDoubleBetTypePattern);
    expect('1st-or-last-single').toMatch(firstOrLastSingleOrDoubleBetTypePattern);
    expect('1st-or-last-not-single').toMatch(firstOrLastSingleOrDoubleBetTypePattern);
    expect('last-singles').not.toMatch(firstOrLastSingleOrDoubleBetTypePattern);
  });

  test('N-Direct pattern', () => {
    expect(nDirectBetTypePattern).toBeDefined();
    expect('2-direct').toMatch(nDirectBetTypePattern);
    expect('5-direct').toMatch(nDirectBetTypePattern);
    expect('A5-direct').not.toMatch(nDirectBetTypePattern);
    expect('2-direction').not.toMatch(nDirectBetTypePattern);
  });

  test('Mix-N pattern', () => {
    expect(mixNBetTypePattern).toBeDefined();
    expect('mix-2').toMatch(mixNBetTypePattern);
    expect('mix-40').toMatch(mixNBetTypePattern);
    expect('match-mix-2').not.toMatch(mixNBetTypePattern);
  });

  test('Most colour pattern', () => {
    expect(mostColourBetTypePattern).toBeDefined();
    expect('most-blue').toMatch(mostColourBetTypePattern);
    expect('most-red').toMatch(mostColourBetTypePattern);
    expect('most-yellow').toMatch(mostColourBetTypePattern);
    expect('most-bluer').not.toMatch(mostColourBetTypePattern);
    expect('any-colour-2').not.toMatch(mostColourBetTypePattern);
    expect('most-black').not.toMatch(mostColourBetTypePattern);
  });

  test('Colour over pattern', () => {
    expect(colourOverBetTypePattern).toBeDefined();
    expect('yellow-over').toMatch(colourOverBetTypePattern);
    expect('red-over').toMatch(colourOverBetTypePattern);
    expect('blue-over').toMatch(colourOverBetTypePattern);
    expect('black-over').not.toMatch(colourOverBetTypePattern);
    expect('any-colour-2').not.toMatch(colourOverBetTypePattern);
    expect('no-black').not.toMatch(colourOverBetTypePattern);
  });

  test('Colour ratio pattern', () => {
    expect(colourRatioBetTypePattern).toBeDefined();
    expect('ratio-2-2-2').toMatch(colourRatioBetTypePattern);
    expect('ratio-2-4').toMatch(colourRatioBetTypePattern);
    expect('ratio-6').toMatch(colourRatioBetTypePattern);
    expect('no-black').toMatch(colourRatioBetTypePattern);
    expect('1-black').toMatch(colourRatioBetTypePattern);
    expect('any-colour-2').toMatch(colourRatioBetTypePattern);
    expect('ratio-06').not.toMatch(colourRatioBetTypePattern);
    expect('any-color-2').not.toMatch(colourRatioBetTypePattern);
    expect('black').not.toMatch(colourRatioBetTypePattern);
    expect('many-colour-2').not.toMatch(colourRatioBetTypePattern);
  });

  test('Anaconda-N pattern', () => {
    expect(anacondaNBetTypePattern).toBeDefined();
    expect('anaconda-2').toMatch(anacondaNBetTypePattern);
    expect('anaconda-20').toMatch(anacondaNBetTypePattern);
    expect('banaconda-4').not.toMatch(anacondaNBetTypePattern);
    expect('anaconda6').not.toMatch(anacondaNBetTypePattern);
  });

  test('isUrl pattern', () => {
    expect(isUrl).toBeDefined();
    expect(() => isUrl("")).not.toThrowError();
    expect(isUrl('https://facebook.com')).toBe(true);
    expect(isUrl('/last-singles')).toBe(false);
  });
});
