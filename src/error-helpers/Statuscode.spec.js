const { test, expect } = require("@jest/globals");
const {
  OK,
  CREATED,
  FORBIDDEN,
  UNAUTHORIZED,
  BAD_REQUEST,
  NOT_FOUND,
  REQUEST_TIMEOUT,
  INTERNAL_SERVER
} = require("./Statuscode");

describe('Status code tests', () => {
  test('OK exists', () => {
    expect(OK).toBeDefined();
    expect(OK).toBe(200);
  });

  test('CREATED Exists', () => {
    expect(CREATED).toBeDefined();
    expect(CREATED).toBe(201);
  });

  test('FORBIDDEN Exists', () => {
    expect(FORBIDDEN).toBeDefined();
    expect(FORBIDDEN).toBe(403);
  });

  test('UNAUTHORIZED Exists', () => {
    expect(UNAUTHORIZED).toBeDefined();
    expect(UNAUTHORIZED).toBe(401);
  });

  test('BAD_REQUEST Exists', () => {
    expect(BAD_REQUEST).toBeDefined();
    expect(BAD_REQUEST).toBe(400);
  });

  test('NOT_FOUND Exists', () => {
    expect(NOT_FOUND).toBeDefined();
    expect(NOT_FOUND).toBe(404);
  });

  test('REQUEST_TIMEOUT Exists', () => {
    expect(REQUEST_TIMEOUT).toBeDefined();
    expect(REQUEST_TIMEOUT).toBe(408);
  });

  test('INTERNAL_SERVER Exists', () => {
    expect(INTERNAL_SERVER).toBeDefined();
    expect(INTERNAL_SERVER).toBe(500);
  });
});
