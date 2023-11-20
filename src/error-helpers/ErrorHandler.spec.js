const { test, expect } = require("@jest/globals");
const {
  isAxiosError,
  isTrustedError,
  handleAxiosError,
  handleGeneralErrors,
  handleTrustedError
} = require("./ErrorHandler");

describe('Error Handler Tests', () => {
  test('isAxiosError exists', () => {
    expect(isAxiosError).toBeDefined();
  });

  test('isTrustedError exists', () => {
    expect(isTrustedError).toBeDefined();
  });

  test('handleAxiosError exists', () => {
    expect(handleAxiosError).toBeDefined();
  });

  test('handleGeneralErrors exists', () => {
    expect(handleGeneralErrors).toBeDefined();
  });

  test('handleTrustedError exists', () => {
    expect(handleTrustedError).toBeDefined();
  });
});
