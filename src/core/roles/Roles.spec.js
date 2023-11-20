const { test, expect } = require("@jest/globals");
const {
  PLAYER,
  SUPER_ADMIN,
  FINANCE_ADMIN,
  CUSTOMER_CARE,
} = require("./Roles");

describe('Defined Roles tests', () => {
  test('PLAYER exists', () => {
    expect(PLAYER).toBeDefined();
    expect(PLAYER).toHaveProperty('name', 'player');
  });

  test('SUPER_ADMIN exists', () => {
    expect(SUPER_ADMIN).toBeDefined();
    expect(SUPER_ADMIN).toHaveProperty('name', 'superadmin');
  });

  test('FINANCE_ADMIN exists', () => {
    expect(FINANCE_ADMIN).toBeDefined();
    expect(FINANCE_ADMIN).toHaveProperty('name', 'financeadmin');
  });

  test('CUSTOMER_CARE exists', () => {
    expect(CUSTOMER_CARE).toBeDefined();
    expect(CUSTOMER_CARE).toHaveProperty('name', 'customercareadmin');
  });
});
