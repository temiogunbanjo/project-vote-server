const { expect } = require("@jest/globals");
const PaymentHandlerInterface = require("./PaymentHandlerInterface");

describe('Payment Handler Interface Utility tests', () => {
  test('_creditBank exist', () => {
    expect(PaymentHandlerInterface._creditBank).toBeDefined();
  });

  test('_creditWallet exist', () => {
    expect(PaymentHandlerInterface._creditWallet).toBeDefined();
  });

  test('_debitWallet exists', () => {
    expect(PaymentHandlerInterface._debitWallet).toBeDefined();
  });

  test('_fetchBanks exists', () => {
    expect(PaymentHandlerInterface._fetchBanks).toBeDefined();
  });

  test('_refreshUser exists', () => {
    expect(PaymentHandlerInterface._refreshUser).toBeDefined();
  });

  test('_verifyAccountNumber exists', () => {
    expect(PaymentHandlerInterface._verifyAccountNumber).toBeDefined();
  });

  test('_verifyPayment exists', () => {
    expect(PaymentHandlerInterface._verifyPayment).toBeDefined();
  });
});
