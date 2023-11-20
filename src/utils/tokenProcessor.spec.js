const { test, expect } = require("@jest/globals");
const {
  verifyToken,
  createToken,
  createHashedToken,
  verifyHashedToken,
} = require("./tokenProcessor");

describe("VerifyToken Tests", () => {
  test("Should exist", () => {
    expect(verifyToken).toBeDefined();
  });
});

describe("CreateToken Tests", () => {
  test("Should exist", () => {
    expect(createToken).toBeDefined();
  });
});

describe("CreateHashedToken Tests", () => {
  test("Should exist", () => {
    expect(createHashedToken).toBeDefined();
  });
});

describe("VerifyHashedToken Tests", () => {
  test("Should exist", () => {
    expect(verifyHashedToken).toBeDefined();
  });
});
