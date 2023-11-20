const { expect } = require("@jest/globals");
const PaymentHandler = require("./PaymentHandler");

describe("Payment Handler Utility tests", () => {
  test("verifyPayment exist", () => {
    expect(PaymentHandler.verifyPayment).toBeDefined();
  });

  test("getBanks exist", () => {
    expect(PaymentHandler.getBanks).toBeDefined();
  });

  test("multiPaymentAnalyzer exists", () => {
    expect(PaymentHandler.multiPaymentAnalyzer).toBeDefined();
  });

  test("makeCompoundPayout exists", () => {
    expect(PaymentHandler.makeCompoundPayout).toBeDefined();
  });

  test("makeSinglePayout exists", () => {
    expect(PaymentHandler.makeSinglePayout).toBeDefined();
  });

  test("chargeWallet exists", async () => {
    expect(PaymentHandler.chargeWallet).toBeDefined();
  });

  test("depositIntoBank exists", () => {
    expect(PaymentHandler.depositIntoBank).toBeDefined();
  });

  test("depositIntoWallet exists", () => {
    expect(PaymentHandler.depositIntoWallet).toBeDefined();
  });
});
