const { test, expect } = require("@jest/globals");
const {
  sendErrorResponse,
  sendSuccessResponse,
} = require("./sendResponses");

describe("SendErrorResponse Tests", () => {
  test("Should exist", () => {
    expect(sendErrorResponse).toBeDefined();
  });
});

describe("SendSuccessResponse Tests", () => {
  test("Should exist", () => {
    expect(sendSuccessResponse).toBeDefined();
  });
});
