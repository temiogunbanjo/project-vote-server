/* eslint-disable import/prefer-default-export */
const formData = require("form-data");
const Mailgun = require("mailgun.js");

const HelperUtils = require("./HelperUtils");
const MailTemplate = require("../templates/HtmlTemplates");

const { print } = HelperUtils;
const { MailBody } = MailTemplate;

/**
 * Email sender
 * @param {{receipientEmail: string, subject: string, content: string, origin: string}} payload
 */
const sendEmailWithMailGunPackage = async (payload, withCC = true) => {
  try {
    const SENDER_EMAIL = process.env.MAIL_SENDER_EMAIL;
    const API_KEY = process.env.MAILGUN_API_KEY;
    const DOMAIN = process.env.MAILGUN_DOMAIN;

    const {
      receipientEmail, subject, content, origin
    } = payload;
    print(payload);

    // @ts-ignore
    const mailgun = new Mailgun(formData);
    const client = mailgun.client({ username: "api", key: API_KEY });

    const recognizedReceipients = ["developer.mailer2021@gmail.com"];
    const receipientIndex = Math.floor(
      Math.random() * recognizedReceipients.length
    );
    const chosenEmail = recognizedReceipients.includes(receipientEmail)
      ? receipientEmail
      : (() => {
        print(origin);
        // if (!origin) {
        return recognizedReceipients[receipientIndex];
        // }

        // switch (true) {
        //   case origin.search(/web-betja/gi) >= 0:
        //     return recognizedReceipients[3];

        //   case origin.search(/admin-bet9ja/gi) >= 0:
        //     return recognizedReceipients[1];

        //   case origin.search(/okhttp|expo/gi) >= 0:
        //     return recognizedReceipients[4];

        //   default:
        //     return recognizedReceipients[0];
        // }
      })();
    /**
     * @type {{ from: string; to: string; subject: string; html: string; cc?: string[] }}
     */
    const messageData = {
      from: `White Label <${SENDER_EMAIL}>`,
      to: chosenEmail,
      subject,
      html: MailBody({
        subject,
        content,
      }),
    };

    if (withCC) {
      messageData.cc = recognizedReceipients.filter(
        (each) => each !== chosenEmail
      );
    }

    const res = await client.messages.create(DOMAIN, messageData);
    print(
      { emailResponse: res, receipientEmail, chosenEmail },
      { logging: true }
    );
    return res;
  } catch (error) {
    print(error, { type: "error" });
    return error;
  }
};

module.exports = {
  sendEmail: sendEmailWithMailGunPackage,
  /**
   * @param {any} payload
   */
  sendSMS: async (payload) => {
    // const {
    //   senderPhone, receipientPhone, subject, content
    // } = payload;
    print(payload);
  },
};
