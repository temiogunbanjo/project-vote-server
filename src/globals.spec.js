const { test, expect } = require("@jest/globals");
const {
  BONUS_GAME_ODDS_DROP,
  BONUS_TYPES,
  BONUS_STATUSES,
  TRANSACTION_TYPES
} = require("./globals");

describe('Global Parameters tests', () => {
  test('BONUS_GAME_ODDS_DROP Test', () => {
    expect(BONUS_GAME_ODDS_DROP).toBeDefined();
  });

  test('BONUS_TYPES Exists', () => {
    expect(BONUS_TYPES).toBeDefined();
    // expect(BONUS_TYPES?.INFLUENCER).toBeDefined();
    expect(BONUS_TYPES?.BUNDLE).toBeDefined();
    expect(BONUS_TYPES?.NORMAL).toBeDefined();
  });

  test('BONUS_STATUSES Exists', () => {
    expect(BONUS_STATUSES).toBeDefined();
    expect(BONUS_STATUSES?.MATURED).toBeDefined();
    expect(BONUS_STATUSES?.NONE).toBeDefined();
    expect(BONUS_STATUSES?.PENDING).toBeDefined();
  });

  test('TRANSACTION_TYPES Exists', () => {
    expect(TRANSACTION_TYPES).toBeDefined();
    expect(TRANSACTION_TYPES?.CHARGE).toBeDefined();
    expect(TRANSACTION_TYPES?.COMMISSION).toBeDefined();
    expect(TRANSACTION_TYPES?.DEPOSIT).toBeDefined();
    expect(TRANSACTION_TYPES?.WINNING).toBeDefined();
    expect(TRANSACTION_TYPES?.WITHDRAWAL).toBeDefined();
  });
});
