const { test } = require("@jest/globals");
const {
  encrypt, encryptV2, decrypt, compareHashAndString
} = require("./hash");

describe('Hash Utility Tests', () => {
  test('Encrypt Test', () => {
    expect(encrypt).toBeDefined();
    expect(() => encrypt('hello')).not.toThrowError();
  });

  test('Encrypt V2 Test', () => {
    expect(encryptV2).toBeDefined();
    expect(() => encryptV2('hello')).not.toThrowError();
  });

  test('Decrypt Test', () => {
    expect(decrypt).toBeDefined();
    // expect(decrypt).not.toThrowError();
  });

  test('CompareHashAndString Test', () => {
    expect(compareHashAndString).toBeDefined();
    // expect(compareHashAndString).not.toThrowError();
  });
});
