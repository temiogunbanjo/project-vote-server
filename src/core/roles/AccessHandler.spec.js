const { test, expect } = require("@jest/globals");
const { populateAppRolesPermissions } = require("./AccessHandler");

describe("Access Tests", () => {
  test("populateAppRolesPermissions exists", () => {
    expect(populateAppRolesPermissions).toBeDefined();
    expect(populateAppRolesPermissions).toBeInstanceOf(Function);
  });

  test("populateAppRolesPermissions Works Properly", () => {
    expect(() => populateAppRolesPermissions()).not.toThrowError();
    expect(populateAppRolesPermissions()).toHaveProperty("CUSTOMER_CARE");
  });
});
