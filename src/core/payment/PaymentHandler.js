/* eslint-disable no-underscore-dangle */
const axios = require("axios");
const HelperUtils = require("../../utils/HelperUtils");
const HttpStatusCode = require("../../error-helpers/Statuscode");
const transactionLogger = require("../../utils/logger");

const Transaction = require("../../schemas/TransactionSchema");

const { printToFile: print } = HelperUtils;
// eslint-disable-next-line no-unused-vars
const walletEvent = require("../events/WalletEvent");
const paymentEvent = require("../events/PaymentEvent");
const PaymentHandlerInterface = require("./PaymentHandlerInterface");
const { TRANSACTION_TYPES, WALLET_TYPES } = require("../../globals");
const {
  WALLET_DEPOSIT,
  CREATE_TRANSACTION_CHARGES,
  WALLET_CHARGE,
} = require("../events/eventTypes");

/**
@class
*/
class PaymentHandler extends PaymentHandlerInterface {
  /**
   * @param {string} reference
   * @param {string} paymentMethod
   */
  static async verifyPayment(reference, paymentMethod) {
    try {
      print({ reference, paymentMethod });
      return this._verifyPayment(reference, paymentMethod);
    } catch (error) {
      return error;
    }
  }

  /**
   * @param {string} country
   */
  static async getBanks(country = "nigeria") {
    try {
      return this._fetchBanks(country);
    } catch (error) {
      return null;
    }
  }

  /**
   * @param {import("../../database/DataRepo")} datasource
   * @param {Transaction} transaction
   * @param {{
   * from: User;
   * sourceAccount: 'mainWallet' | 'bonusWallet' | 'commissionWallet';
   * }} transactionOptions
   */
  static async chargeWallet(datasource, transaction, transactionOptions) {
    transactionOptions = {
      sourceAccount: WALLET_TYPES.MAIN,
      destAccount: WALLET_TYPES.MAIN,
      ...transactionOptions,
    };

    if (!transactionOptions.from) {
      return {
        message: "Account to debit was not found",
        code: HttpStatusCode.BAD_REQUEST,
        isError: true,
      };
    }

    let createTransactionResponse = null;

    if (!transaction?.transactionId) {
      // Create transaction record
      createTransactionResponse = await datasource.createTransaction(
        transaction
      );
      if (!createTransactionResponse) return createTransactionResponse;
    } else {
      createTransactionResponse = transaction;
    }

    print("Using previous transaction", { logging: true });
    // Debit user
    const debitWalletResponse = await this._debitWallet(
      datasource,
      createTransactionResponse,
      transactionOptions
    );

    if (debitWalletResponse && !debitWalletResponse.isError) {
      setImmediate(() => {
        paymentEvent.emit(WALLET_CHARGE, {
          user: transactionOptions?.from,
          title: "Wallet Notification",
          content: `Your wallet was charged ${transaction.amount} successfully!`,
          data: debitWalletResponse,
        });
      });
    }
    return debitWalletResponse;
  }

  /**
   *
   * @param {import("../../database/DataRepo")} datasource
   * @param {Transaction} transaction
   * @param {{to: User}} transactionOptions
   */
  static async depositIntoWallet(datasource, transaction, transactionOptions) {
    transactionOptions = {
      sourceAccount: WALLET_TYPES.MAIN,
      destAccount: WALLET_TYPES.MAIN,
      ...transactionOptions,
    };

    if (!transactionOptions.to) {
      return {
        message: "Account to credit was not given",
        code: HttpStatusCode.BAD_REQUEST,
        isError: true,
      };
    }

    let createTransactionResponse = null;

    if (!transaction?.transactionId) {
      // Create transaction record
      createTransactionResponse = await datasource.createTransaction(
        transaction
      );

      if (!createTransactionResponse) {
        return createTransactionResponse;
      }
    } else {
      // print("Using previous transaction", { logging: true });
      createTransactionResponse = transaction;
    }

    // console.log({
    //   u: createTransactionResponse.update,
    //   c: createTransactionResponse
    // });

    const creditWalletResponse = await this._creditWallet(
      datasource,
      createTransactionResponse,
      transactionOptions
    );

    if (creditWalletResponse && !creditWalletResponse.isError) {
      paymentEvent.emit(WALLET_DEPOSIT, {
        user: transactionOptions?.to,
        title: "Wallet Notification",
        content: `Deposit of ${transaction.amount} successful!`,
        data: creditWalletResponse,
      });
    }
    // Credit user
    return creditWalletResponse;
  }

  /**
   *
   * @param {import("../../database/DataRepo")} datasource
   * @param {Transaction} transaction
   * @param {{
   *  paymentMethod: 'paystack' | 'interswitch',
   *  sourceAccount?: string,
   *  destAccount?: string,
   *  to: {
   *    userId: string,
   *    accountName: string,
   *    accountNumber: string,
   *    bankCode: string
   *  }
   * }} transactionOptions
   */
  static async depositIntoBank(datasource, transaction, transactionOptions) {
    transactionOptions = {
      sourceAccount: WALLET_TYPES.MAIN,
      destAccount: WALLET_TYPES.MAIN,
      ...transactionOptions,
    };

    if (!transactionOptions.to) {
      return {
        message: "Account to credit was not given",
        code: HttpStatusCode.BAD_REQUEST,
        isError: true,
      };
    }

    let createTransactionResponse = null;

    if (!transaction?.transactionId) {
      // Create transaction record
      createTransactionResponse = await datasource.createTransaction(
        transaction
      );

      if (!createTransactionResponse) {
        return createTransactionResponse;
      }
    } else {
      // print("Using previous transaction", { logging: true });
      createTransactionResponse = transaction;
    }

    // Credit user's bank
    const creditBankResponse = await this._creditBank(
      datasource,
      createTransactionResponse.dataValues,
      transactionOptions
    );

    print(creditBankResponse);

    if (creditBankResponse && !creditBankResponse.isError) {
      print(
        `Sending notification to user(${
          transactionOptions?.to?.accountName || "--"
        })...`
      );
      await datasource.sendNotificationToUser(transactionOptions?.to?.userId, {
        title: "Wallet Notification",
        content: `Withdrawal of ${transaction.amount} to bank is successful!`,
      });
    }

    return creditBankResponse;
  }

  /**
   * @param {import("../../database/DataRepo")} datasource
   * @param {Transaction} transaction
   * @param {{
   * from: User,
   * to: User,
   * recipientNarration?: string,
   * recipientCharges?: number | string,
   * sourceAccount?: string,
   * destAccount?: string
   * }} transactionOptions
   */
  static async walletTransfer(datasource, transaction, transactionOptions) {
    const debitedUser = transactionOptions.from;
    const creditedUser = transactionOptions.to;

    print(
      `Trf from ${debitedUser.firstname} ${debitedUser.lastname} to ${creditedUser.firstname} ${creditedUser.lastname}`
    );
    transactionOptions.sourceAccount = transactionOptions.sourceAccount || WALLET_TYPES.MAIN;
    transactionOptions.destAccount = transactionOptions.destAccount || WALLET_TYPES.MAIN;
    transactionOptions.recipientNarration = transactionOptions.recipientNarration
      || `Trf from ${debitedUser.firstname} ${debitedUser.lastname}.`;
    transactionOptions.recipientCharges = Number(
      transactionOptions.recipientCharges || 0
    );

    // Create transaction record
    const createDebitTransactionResponse = await datasource.createTransaction(
      transaction
    );
    if (!createDebitTransactionResponse) {
      return createDebitTransactionResponse;
    }

    // Debit user
    const debitResponse = await this._debitWallet(
      datasource,
      createDebitTransactionResponse,
      transactionOptions
    );

    if (!debitResponse || debitResponse.isError) {
      return debitResponse;
    }

    // Send Debit notification to sender
    await datasource.sendNotificationToUser(debitedUser.userId, {
      title: "Transfer initiated successfully",
      content: `Debit of ${transaction.amount} occurred on your wallet`,
    });

    // Credit Receipient
    const creditTransaction = new Transaction(
      creditedUser,
      TRANSACTION_TYPES.DEPOSIT,
      transaction.amount - transactionOptions.recipientCharges,
      transactionOptions.recipientNarration,
      transaction.referenceId,
      transaction.provider,
      true,
      transactionOptions.destAccount,
      true
    );

    // Create credit transaction record
    const createCreditTransactionResponse = await datasource.createTransaction(
      creditTransaction
    );

    if (!createCreditTransactionResponse) {
      return createCreditTransactionResponse;
    }
    // HelperUtils.print(creditResponse);

    const creditResponse = await this._creditWallet(
      datasource,
      createCreditTransactionResponse,
      transactionOptions
    );

    if (!creditResponse || creditResponse.isError) {
      return creditResponse;
    }

    // Record charges Receipient
    if (Number(transactionOptions.recipientCharges) > 0) {
      const chargesTransaction = new Transaction(
        creditedUser,
        TRANSACTION_TYPES.CHARGE,
        transactionOptions.recipientCharges,
        "Commission charges",
        creditTransaction.referenceId,
        creditTransaction.provider,
        true,
        creditTransaction.transactionSource,
        false
      );

      walletEvent.emit(CREATE_TRANSACTION_CHARGES, {
        data: {
          user: creditedUser,
          transaction: chargesTransaction,
        },
      });
    }

    await datasource.sendNotificationToUser(creditedUser.userId, {
      title: "Wallet Notification",
      content: `Received ${transaction.amount} in your wallet!`,
    });

    return debitResponse;
  }

  /**
   *
   * @param {import("../../database/DataRepo")} datasource
   * @param {Transaction} transaction
   * @param {{
   *  paymentMethod: 'paystack' | 'interswitch',
   *  sourceAccount?: string,
   *  destAccount?: string,
   *  to: {
   *    userId: string,
   *    accountName: string,
   *    accountNumber: string,
   *    bankCode: string
   *  }
   * }} transactionOptions
   */
  static async withdrawFromWalletToBank(
    datasource,
    transaction,
    transactionOptions
  ) {
    transactionOptions = {
      paymentMethod: "paystack",
      sourceAccount: WALLET_TYPES.MAIN,
      destAccount: WALLET_TYPES.MAIN,
      ...transactionOptions,
    };

    const userToCredit = transactionOptions.to;

    transactionLogger(
      userToCredit.userId || transaction.userId,
      transaction,
      "Making bank withdrawal"
    );

    try {
      const createTransactionResponse = await datasource.createTransaction(
        transaction
      );
      if (!createTransactionResponse) {
        return {
          message: "Could not create transaction",
          code: HttpStatusCode.INTERNAL_SERVER,
          isError: true,
        };
      }

      print("debiting wallet........");
      const userInfo = await datasource.fetchOneUser(
        userToCredit.userId,
        false
      );
      const debitWalletResponse = await this._debitWallet(
        datasource,
        createTransactionResponse.dataValues,
        {
          paymentMethod: transactionOptions.paymentMethod,
          sourceAccount: transactionOptions.sourceAccount,
          destAccount: transactionOptions.destAccount,
          from: userInfo,
        }
      );

      if (!debitWalletResponse || debitWalletResponse.isError) {
        return debitWalletResponse;
      }

      const creditBankResponse = await this._creditBank(
        datasource,
        transaction,
        transactionOptions
      );

      if (!creditBankResponse || creditBankResponse.isError) {
        const reversalTransaction = new Transaction(
          userInfo,
          TRANSACTION_TYPES.DEPOSIT,
          createTransactionResponse.amount,
          "Wallet withdrawal reversal",
          createTransactionResponse.referenceId,
          createTransactionResponse.provider,
          true,
          createTransactionResponse.transactionSource,
          false
        );

        await this.reverseWalletCharge(datasource, reversalTransaction, {
          to: userInfo,
        });

        return {
          message: "Could not pay to bank",
          code: HttpStatusCode.INTERNAL_SERVER,
          isError: true,
        };
      }

      return creditBankResponse;
    } catch (error) {
      print(error);
      const errorContent = !error.response
        ? {
          message: error.message,
          code: error.code,
          isError: true,
        }
        : {
          ...error.response.data,
          isError: true,
        };
      print(errorContent);
      transactionLogger(
        transactionOptions?.to?.accountName || transaction.userId,
        transaction,
        errorContent
      );
      return errorContent;
    }
  }

  /**
   *
   * @param {import("../../database/DataRepo")} datasource
   * @param {*} transaction
   * @param {*} transactionOptions
   */
  static async finalizeWithdrawToBank(
    datasource,
    transaction,
    transactionOptions
  ) {
    transactionOptions = {
      destAccount: WALLET_TYPES.MAIN,
      ...transactionOptions,
    };
    // const debitedUser = transactionOptions.from;

    try {
      // Finalize transfer
      const trfFinalizationResponse = await axios({
        method: "POST",
        url: `${process.env.PAYSTACK_BASE_URL}/transfer/finalize_transfer`,
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        data: {
          transfer_code: transaction.referenceId,
          otp: transactionOptions.otp,
        },
      });
      HelperUtils.print({ trfFinalizationResponse });

      // Debit user wallet
      return this._debitWallet(datasource, transaction, transactionOptions);
      // return response;
    } catch (error) {
      const errorContent = !error.response
        ? {
          message: error.message,
          code: error.code,
          isError: true,
        }
        : {
          ...error.response.data,
          isError: true,
        };
      HelperUtils.print(errorContent);
      return errorContent;
    }
  }

  /**
   * @param {import("../../database/DataRepo")} datasource
   * @param {Transaction} transaction
   * @param {{
   *  paymentMethod?: 'paystack' | 'interswitch',
   *  sourceAccount?: string,
   *  destAccount?: string,
   *  to: User
   * }} transactionOptions
   */
  static async reverseWalletCharge(
    datasource,
    transaction,
    transactionOptions
  ) {
    transactionOptions = {
      sourceAccount: WALLET_TYPES.MAIN,
      destAccount: WALLET_TYPES.MAIN,
      ...transactionOptions,
    };

    HelperUtils.print({ transaction, transactionOptions });

    // Create transaction record
    const createTransactionResponse = await datasource.createTransaction(
      transaction
    );
    if (!createTransactionResponse) return createTransactionResponse;

    // Debit user
    return this._creditWallet(
      datasource,
      createTransactionResponse,
      transactionOptions
    );
  }

  /**
   *
   * @param {import("../../database/DataRepo")} datasource
   * @param {*} transaction
   * @param {*} transactionOptions
   */
  static async reverseWalletDeposit(
    datasource,
    transaction,
    transactionOptions
  ) {
    transactionOptions = {
      sourceAccount: WALLET_TYPES.MAIN,
      destAccount: WALLET_TYPES.MAIN,
      ...transactionOptions,
    };
    // HelperUtils.print(transaction, creditedUser);

    // Create transaction record
    const createTransactionResponse = await datasource.createTransaction(
      transaction
    );
    if (!createTransactionResponse) return null;

    // Debit user
    return this._debitWallet(
      datasource,
      createTransactionResponse.dataValues,
      transactionOptions
    );
  }

  /**
   * @param {import("../../database/DataRepo")} datasource
   * @param {*} transaction
   * @param {*} config
   */
  static async reverseWalletTransfer(datasource, transaction, config) {
    let transactionOptions = config;
    const debitedUser = transactionOptions.from;
    const creditedUser = transactionOptions.to;

    transactionOptions = {
      ...transactionOptions,
      from: creditedUser,
      to: debitedUser,
      sourceAccount: transactionOptions.sourceAccount || WALLET_TYPES.MAIN,
      destAccount: transactionOptions.destAccount || WALLET_TYPES.MAIN,
    };

    // Create transaction record
    const createTransactionResponse = await datasource.createTransaction(
      transaction
    );
    if (!createTransactionResponse) {
      return createTransactionResponse;
    }

    // Debit previous receipient
    const debitResponse = await this._debitWallet(
      datasource,
      createTransactionResponse,
      transactionOptions
    );

    if (!debitResponse || debitResponse.isError) {
      return debitResponse;
    }

    // Send Debit notification to previous receipient
    await datasource.sendNotificationToUser(transactionOptions.from, {
      title: "Transfer Reversed",
      content: `Debit of ${transaction.amount} occurred on your wallet`,
    });

    // Credit previous sender
    const creditTransaction = new Transaction(
      creditedUser,
      TRANSACTION_TYPES.DEPOSIT,
      transaction.amount,
      `RVSL Trf from ${debitedUser.firstname} ${debitedUser.lastname}.`,
      transaction.referenceId,
      transaction.provider,
      true,
      transactionOptions.destAccount,
      true
    );

    // Create credit transaction record
    const createCreditTransactionResponse = await datasource.createTransaction(
      creditTransaction
    );

    if (!createCreditTransactionResponse) {
      return createCreditTransactionResponse;
    }

    await datasource.sendNotificationToUser(transactionOptions.to, {
      title: "Transfer Reversed",
      content: `Credit of ${transaction.amount} occurred on your wallet`,
    });

    // HelperUtils.print(creditResponse);
    return this._creditWallet(
      datasource,
      createCreditTransactionResponse,
      transactionOptions
    );
  }

  /**
   * @param {Number} totalWinning
   * @param {object} options
   * @returns Object
   */
  static multiPaymentAnalyzer(totalWinning, options = {}) {
    options = {
      firstPayPercent: 0.2,
      firstPayMaxAmount: 10e6,
      recurringPayPercent: 0.2,
      recurringPayMaxAmount: 10e6,
      maxDuration: 36,
      ...options,
    };
    let recurringPay;
    let numberOfMonths;
    const potWin = parseFloat(totalWinning).toFixed(2);

    const firstPay = potWin * options.firstPayPercent > options.firstPayMaxAmount
      ? options.firstPayMaxAmount
      : potWin * options.firstPayPercent;

    if (potWin - firstPay >= potWin * options.recurringPayPercent) {
      recurringPay = potWin * options.recurringPayPercent > options.recurringPayMaxAmount
        ? options.recurringPayMaxAmount
        : potWin * options.recurringPayPercent;
    } else {
      recurringPay = potWin - firstPay;
    }

    numberOfMonths = Math.ceil((potWin - firstPay) / recurringPay);
    numberOfMonths = numberOfMonths > options.maxDuration
      ? options.maxDuration
      : numberOfMonths;

    return {
      firstPay,
      recurringPay,
      numberOfMonths,
    };
  }
}

module.exports = PaymentHandler;
