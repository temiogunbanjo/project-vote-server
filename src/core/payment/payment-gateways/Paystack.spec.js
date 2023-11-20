const { expect } = require("@jest/globals");
const Paystack = require("./Paystack");

describe('Payment Handler Interface Utility tests', () => {
  test('createTransferReceipient exist', () => {
    expect(Paystack.createTransferReceipient).toBeDefined();
  });

  test('fetchBanks exists', () => {
    expect(Paystack.fetchBanks).toBeDefined();
  });

  test('initializeTransfer exists', () => {
    expect(Paystack.initializeTransfer).toBeDefined();
  });

  test('sendResponse exists', () => {
    expect(Paystack.sendResponse).toBeDefined();
  });

  test('verifyAccountNumber exists', () => {
    expect(Paystack.verifyAccountNumber).toBeDefined();
  });

  test('verifyPayment exists', () => {
    expect(Paystack.verifyPayment).toBeDefined();
  });
});
