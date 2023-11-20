const { describe, test, expect } = require("@jest/globals");
const HtmlTemplates = require("./HtmlTemplates");

describe("HTML template test", () => {
  test("Mail body exist", () => {
    expect(HtmlTemplates.MailBody).toBeDefined();
    expect(HtmlTemplates.MailBody).toBeInstanceOf(Function);
    expect(HtmlTemplates.MailBody({ subject: "AH", content: "" })).toBeTruthy();
  });

  test("AccountReactivationMailContent exist", () => {
    const user = { firstname: "", lastname: "" };
    expect(HtmlTemplates.AccountReactivationMailContent).toBeDefined();
    expect(HtmlTemplates.AccountReactivationMailContent).toBeInstanceOf(Function);
    expect(HtmlTemplates.AccountReactivationMailContent(user, "")).toBeTruthy();
  });

  test("VerificationPage exist", () => {
    expect(HtmlTemplates.VerificationPage).toBeDefined();
    expect(HtmlTemplates.VerificationPage).toBeInstanceOf(Function);
    expect(HtmlTemplates.VerificationPage({}, 200, "")).toBeTruthy();
    expect(HtmlTemplates.VerificationPage({}, 400, "/gghgh")).toBeTruthy();
  });

  test("OverdraftSuspensionMailContent exist", () => {
    const user = { firstname: "", lastname: "" };
    const user1 = { firstname: "", lastname: "", status: true };
    expect(HtmlTemplates.OverdraftSuspensionMailContent).toBeDefined();
    expect(HtmlTemplates.OverdraftSuspensionMailContent).toBeInstanceOf(Function);
    expect(HtmlTemplates.OverdraftSuspensionMailContent("direct", user, {}, "200", 100)).toBeTruthy();
    expect(HtmlTemplates.OverdraftSuspensionMailContent("direct", user1, {}, "200", 100)).toBeTruthy();
    expect(HtmlTemplates.OverdraftSuspensionMailContent("indirect", user1, {}, "200", 100)).toBeTruthy();
    expect(HtmlTemplates.OverdraftSuspensionMailContent(null, user, {}, "200", 100)).toBeTruthy();
  });

  test("PinModificationMailContent exist", () => {
    expect(HtmlTemplates.PinModificationMailContent).toBeDefined();
    expect(HtmlTemplates.PinModificationMailContent).toBeInstanceOf(Function);
    expect(HtmlTemplates.PinModificationMailContent("direct", "")).toBeTruthy();
  });

  test("UserVerificationMailContent exist", () => {
    expect(HtmlTemplates.UserVerificationMailContent).toBeDefined();
    expect(HtmlTemplates.UserVerificationMailContent).toBeInstanceOf(Function);
    expect(HtmlTemplates.UserVerificationMailContent("direct", "", "")).toBeTruthy();
  });

  test("ResetPasswordMailContent exist", () => {
    expect(HtmlTemplates.ResetPasswordMailContent).toBeDefined();
    expect(HtmlTemplates.ResetPasswordMailContent).toBeInstanceOf(Function);
    expect(HtmlTemplates.ResetPasswordMailContent("direct", "gg")).toBeTruthy();
  });

  test("USSDUserVerificationMailContent exist", () => {
    expect(HtmlTemplates.USSDUserVerificationMailContent).toBeDefined();
    expect(HtmlTemplates.USSDUserVerificationMailContent).toBeInstanceOf(Function);
    expect(HtmlTemplates.USSDUserVerificationMailContent("direct", "", "", "")).toBeTruthy();
  });

  test("TicketBlockPasscodeMailContent exist", () => {
    const ticket = {
      Game: {
        name: ""
      }
    };
    expect(HtmlTemplates.TicketBlockPasscodeMailContent).toBeDefined();
    expect(HtmlTemplates.TicketBlockPasscodeMailContent).toBeInstanceOf(Function);
    expect(HtmlTemplates.TicketBlockPasscodeMailContent(ticket, "")).toBeTruthy();
  });
});
