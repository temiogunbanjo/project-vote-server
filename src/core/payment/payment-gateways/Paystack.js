/* eslint-disable valid-jsdoc */
/* eslint-disable class-methods-use-this */
const axios = require("axios");
const { printToFile: print, generateReferenceId } = require("../../../utils/HelperUtils");

/**
 * @class
 */
const PaystackHelper = {
  /**
   * @param {AxiosResponse} response
   */
  sendResponse(response, isError = false) {
    return response?.data && !isError
      ? {
        isError: false,
        data: response?.data?.data,
      }
      : {
        isError: true,
        error: {
          status: response?.response?.status,
          statusText:
              response?.response?.data?.message
              || response?.response?.statusText,
        },
      };
  },

  /**
   * @param {*} country
   */
  async fetchBanks(country = "nigeria") {
    try {
      const bankList = await axios({
        method: "GET",
        url: `${process.env.PAYSTACK_BASE_URL}/bank?country=${country}`,
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      });
      return bankList.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * @method
   * @param { string } accountNumber the account number to check
   * @param { string } bankCode bank code of the acocunt number
   * @returns object
   */
  async verifyAccountNumber(accountNumber, bankCode) {
    try {
      const response = await axios({
        method: "get",
        url: `${process.env.PAYSTACK_BASE_URL}/bank/resolve`,
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
        params: { account_number: accountNumber, bank_code: bankCode },
      });

      return PaystackHelper.sendResponse(response);
    } catch (error) {
      return PaystackHelper.sendResponse(error, true);
    }
  },

  /**
   * @param {*} reference
   */
  async verifyPayment(reference) {
    try {
      const options = {
        method: "get",
        url: `${process.env.PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      };
      const response = await axios(options);
      // console.log(response);
      return response;
    } catch (error) {
      return error;
    }
  },

  /**
   * @param {*} repo
   * @param {*} reference
   */
  async createTransferReceipient(accountNumber, accountName, bankCode) {
    try {
      const payload = {
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      };

      print("Creating transfer receipient...");
      print(payload);

      const response = await axios({
        method: "POST",
        url: `${process.env.PAYSTACK_BASE_URL}/transferrecipient`,
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        data: payload,
      });

      return PaystackHelper.sendResponse(response);
    } catch (error) {
      return PaystackHelper.sendResponse(error, true);
    }
  },

  /**
   *
   * @param {*} amount amount to send in kobo
   * @param {*} receipientCode paystack receipient code
   * @param {*} narration narration
   * @param {*} referenceId custom unique reference Id
   * @returns Promise
   */
  async initializeTransfer(
    amount,
    receipientCode,
    narration,
    referenceId = generateReferenceId()
  ) {
    try {
      const payload = {
        source: "balance",
        reason: narration,
        reference: referenceId,
        amount: `${Math.round(amount)}`,
        recipient: receipientCode,
      };

      print(`Initializing transfer to ${receipientCode}...`);
      print(payload);

      const response = await axios({
        method: "POST",
        url: `${process.env.PAYSTACK_BASE_URL}/transfer`,
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        data: payload,
      });

      return PaystackHelper.sendResponse(response);
    } catch (error) {
      return PaystackHelper.sendResponse(error, true);
    }
  }
};

module.exports = PaystackHelper;
