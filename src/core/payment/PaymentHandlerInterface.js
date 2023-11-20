/* eslint-disable no-underscore-dangle */
const { Transaction } = require("sequelize");
const { sequelize } = require("../../../models");
const { WALLET_TYPES } = require("../../globals");
const PaystackHelper = require("./payment-gateways/Paystack");
const HttpStatusCode = require("../../error-helpers/Statuscode");
const { printToFile: print } = require("../../utils/HelperUtils");
const transactionLogger = require("../../utils/logger");

/**
 * @class
 */
class PaymentHandlerInterface {
  /**
   * @param {string} country
   */
  static async _fetchBanks(country) {
    return PaystackHelper.fetchBanks(country);
  }

  /**
   *
   * @param {DataRepo} datasource
   * @param {User | {
   *    userId: string,
   *    accountName: string,
   *    accountNumber: string,
   *    bankCode: string
   *  }} user
   * @param {{ transaction?: SequelizeTransaction; lock?: boolean }} dbTransaction
   */
  static async _refreshUser(datasource, user, dbTransaction = {}) {
    try {
      const returnedUser = user;
      const refetchUser = await datasource.fetchOneUser(
        returnedUser.userId,
        false,
        dbTransaction
      );
      if (refetchUser) {
        returnedUser.walletBalance = refetchUser.walletBalance;
        returnedUser.commissionBalance = refetchUser.commissionBalance;
      }

      return returnedUser;
    } catch (error) {
      return {
        message: error.message,
        code: HttpStatusCode.INTERNAL_SERVER,
        isError: true,
      };
    }
  }

  /**
   * @param {string} paymentReference
   * @param {"paystack" | "source"} paymentMethod
   */
  static async _verifyPayment(paymentReference, paymentMethod) {
    switch (paymentMethod) {
      case "paystack":
        return PaystackHelper.verifyPayment(paymentReference);

      case "source":
      default:
        print("doing source");
        return {};
    }
  }

  /**
   * @param {*} accountNumber
   * @param {*} bankCode
   */
  static async _verifyAccountNumber(accountNumber, bankCode) {
    return PaystackHelper.verifyAccountNumber(accountNumber, bankCode);
  }

  /**
   *
   * @param {DataRepo} datasource
   * @param {Transaction} transaction
   * @param {{
   *  paymentMethod?: 'paystack' | 'interswitch',
   *  sourceAccount?: string,
   *  destAccount?: string,
   *  from: User | {
   *    userId: string,
   *    accountName: string,
   *    accountNumber: string,
   *    bankCode: string
   *  }
   * }} transactionOptions
   */
  static async _debitWallet(datasource, transaction, transactionOptions) {
    const logReport = [];
    try {
      const result = await sequelize.transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
        },
        async (t) => {
          t.afterCommit(() => {
          // Your logic
            logReport.push({ msg: `Transaction committed...`, dbTransaction: t.id });
            transactionLogger(
              "transaction.log",
              transaction.userId,
              logReport,
            );
          });

          let walletUpdatePayload = {};
          transactionOptions = {
            sourceAccount: WALLET_TYPES.MAIN,
            destAccount: WALLET_TYPES.MAIN,
            ...transactionOptions,
          };

          let debitedUser = transactionOptions.from;

          logReport.push({ msg: `Making debit on ${transactionOptions.sourceAccount}...` });

          const refetchUserResponse = await this._refreshUser(
            datasource,
            debitedUser,
            { transaction: t, lock: true }
          );
          if (!refetchUserResponse?.isError) {
            debitedUser = refetchUserResponse;
          }

          // eslint-disable-next-line max-len
          const isDebittingCommissionWallet = transactionOptions.sourceAccount === WALLET_TYPES.COMMISSION;
          const isDebittingMainWallet = transactionOptions.sourceAccount === WALLET_TYPES.MAIN;

          if (isDebittingMainWallet) {
          // eslint-disable-next-line max-len
            walletUpdatePayload = {
              walletBalance: Number(debitedUser.walletBalance) - Number(transaction.amount),
            };
          } else if (isDebittingCommissionWallet) {
          // eslint-disable-next-line max-len
            walletUpdatePayload = {
              commissionBalance: Number(debitedUser.commissionBalance) - Number(transaction.amount),
            };
          }

          // Update transaction locally
          transaction.currentBalance = walletUpdatePayload.walletBalance
            || walletUpdatePayload.commissionBalance;

          const debitUserResponse = await datasource.updateUser(
            transaction.userId,
            walletUpdatePayload,
            { transaction: t }
          );

          const options = {
            returnValue: null,
            transactionStatus: "success",
          };

          logReport.push({
            debitUserResponse,
            msg: `(DEBIT) Updating user wallet to ${
              walletUpdatePayload.walletBalance || walletUpdatePayload.commissionBalance
            }`,
          });

          // If debit fails, set transaction status from pending to failed
          if (!debitUserResponse || debitUserResponse[1] < 1) {
            options.returnValue = {
              message: "User wallet was not updated",
              code: HttpStatusCode.INTERNAL_SERVER,
              isError: true,
            };
            options.transactionStatus = "failed";
          }

          // update transaction
          const transactionUpdatepayload = {
            status: options.transactionStatus,
            currentBalance: isDebittingMainWallet
              ? walletUpdatePayload.walletBalance
              : walletUpdatePayload.commissionBalance
          };

          // await datasource.updateTransaction(
          //   transaction.userId,
          //   transaction.transactionId,
          //   transactionUpdatepayload,
          //   { transaction: t }
          // );
          if (!options?.returnValue?.isError) {
            await transaction.update(transactionUpdatepayload, { transaction: t });
            await transaction.reload({ transaction: t });

            options.returnValue = transaction.toJSON ? transaction.toJSON() : transaction;
            delete options.returnValue.relationType;
          }

          // options.returnValue.status = options.transactionStatus;
          // delete options.returnValue.relationType;

          logReport.push(options?.returnValue);
          return options.returnValue;
        }
      );

      return result;
    } catch (error) {
      logReport.push(error);
      transactionLogger(
        "transaction.log",
        transactionOptions?.from?.userId || transaction.userId,
        logReport
      );
      return {
        message: error.message,
        code: HttpStatusCode.INTERNAL_SERVER,
        isError: true,
      };
    }
  }

  /**
   *
   * @param {DataRepo} datasource
   * @param {Transaction} transaction
   * @param {{
   *  paymentMethod?: 'paystack' | 'interswitch',
   *  sourceAccount?: string,
   *  destAccount?: string,
   *  to: User
   * }} transactionOptions
   */
  static async _creditWallet(datasource, transaction, transactionOptions) {
    const logReport = [];
    try {
      const result = await sequelize.transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        },
        async (t) => {
          t.afterCommit(() => {
            // Your logic
            logReport.push({ msg: `Transaction committed...`, dbTransaction: t.id });
            transactionLogger(
              "transaction.log",
              transaction.userId,
              logReport
            );
          });

          let walletUpdatePayload = {};
          transactionOptions = {
            sourceAccount: WALLET_TYPES.MAIN,
            destAccount: WALLET_TYPES.MAIN,
            ...transactionOptions,
          };

          let creditedUser = transactionOptions.to;

          const refetchUserResponse = await this._refreshUser(
            datasource,
            creditedUser,
            { transaction: t, lock: true }
          );
          if (!refetchUserResponse?.isError) {
            // If refetched user successfully, update creditedUser
            creditedUser = refetchUserResponse;
          }

          print(`Making credit on ${transactionOptions.destAccount}...`);
          logReport.push({ msg: `Making credit on ${transactionOptions.destAccount}...` });

          // eslint-disable-next-line max-len
          const isCredittingCommissionWallet = transactionOptions.sourceAccount === WALLET_TYPES.COMMISSION;
          const isCredittingMainWallet = transactionOptions.sourceAccount === WALLET_TYPES.MAIN;

          if (isCredittingMainWallet) {
            walletUpdatePayload = {
              walletBalance: Number(creditedUser.walletBalance)
                + Number(transaction.amount),
            };
          } else if (isCredittingCommissionWallet) {
            walletUpdatePayload = {
              commissionBalance: Number(creditedUser.commissionBalance)
                + Number(transaction.amount),
            };
          }

          transaction.currentBalance = walletUpdatePayload.walletBalance
            || walletUpdatePayload.commissionBalance;

          const creditUserResponse = await datasource.updateUser(
            transaction.userId,
            walletUpdatePayload,
            { transaction: t }
          );

          const options = {
            returnValue: null,
            transactionStatus: "success",
          };

          print(
            `(CREDIT) Updated user wallet to ${
              isCredittingMainWallet
                ? creditedUser.walletBalance
                : creditedUser.commissionBalance
            }`
          );

          logReport.push({
            creditUserResponse,
            msg: `(CREDIT) Updated user wallet to ${
              isCredittingMainWallet
                ? creditedUser.walletBalance
                : creditedUser.commissionBalance
            }`,
          });

          // If credit fails, update transaction status from pending to failed
          // console.log(creditUserResponse);
          if (!creditUserResponse || creditUserResponse[1] < 1) {
            options.transactionStatus = "failed";
            options.returnValue = {
              message: "User wallet was not updated",
              code: HttpStatusCode.INTERNAL_SERVER,
              isError: true,
            };
          }

          // update transaction
          const transactionUpdatepayload = {
            status: options.transactionStatus,
            currentBalance: isCredittingMainWallet
              ? walletUpdatePayload.walletBalance
              : walletUpdatePayload.commissionBalance
          };

          print(
            `Updating transaction (${transaction.transactionId}) status to ${options.transactionStatus} for ${transaction.userId}`
          );

          // await datasource.updateTransaction(
          //   transaction.userId,
          //   transaction.transactionId,
          //   transactionUpdatepayload,
          //   { transaction: t }
          // );

          if (!options?.returnValue?.isError) {
            // console.log(transaction);
            await transaction.update(transactionUpdatepayload, { transaction: t });
            await transaction.reload({ transaction: t });

            options.returnValue = transaction.toJSON ? transaction.toJSON() : transaction;
            delete options.returnValue.relationType;
          }

          // transaction.currentBalance = transactionUpdatepayload.currentBalance
          //   || transaction.currentBalance;

          // options.returnValue.status = options.transactionStatus;
          logReport.push(options?.returnValue);
          return options.returnValue;
        }
      );

      return result;
    } catch (error) {
      logReport.push(error);
      transactionLogger(
        "transaction.log",
        transactionOptions?.to?.userId || transaction.userId,
        logReport
      );
      return {
        message: error.message,
        code: HttpStatusCode.INTERNAL_SERVER,
        isError: true,
      };
    }
  }

  /**
   *
   * @param {DataRepo} datasource
   * @param {Transaction} transaction
   * @param {{
   *  paymentMethod: 'paystack' | 'interswitch',
   *  sourceAccount?: string,
   *  destAccount?: string,
   *  receipientCode?: string,
   *  to: {
   *    userId: string,
   *    accountName: string,
   *    accountNumber: string,
   *    bankCode: string
   *  }
   * }} transactionOptions
   */
  static async _creditBank(datasource, transaction, transactionOptions) {
    transactionOptions = {
      paymentMethod: "",
      sourceAccount: WALLET_TYPES.MAIN,
      destAccount: WALLET_TYPES.MAIN,
      ...transactionOptions,
    };

    const userToCredit = transactionOptions.to;

    transactionLogger(
      "transaction.log",
      userToCredit.userId || transaction.userId,
      transaction,
    );

    // let { referenceId } = transaction;

    try {
      print(
        userToCredit.accountNumber,
        userToCredit.accountName,
        userToCredit.bankCode
      );

      const verifyAccountNumberResponse = await PaystackHelper.verifyAccountNumber(
        userToCredit.accountNumber,
        userToCredit.bankCode
      );

      print({ verifyAccountNumberResponse });

      if (verifyAccountNumberResponse?.isError) {
        return {
          message:
            verifyAccountNumberResponse?.error?.statusText
            || "Could not resolve account number",
          code:
            verifyAccountNumberResponse?.error?.status
            || HttpStatusCode.BAD_REQUEST,
          isError: true,
          error: verifyAccountNumberResponse.error,
        };
      }

      let recipientCode = transactionOptions.receipientCode;

      // Create transfer receipient
      if (!recipientCode) {
        const createPaystackReceipient = await PaystackHelper.createTransferReceipient(
          verifyAccountNumberResponse.data?.account_number,
          verifyAccountNumberResponse.data?.account_name,
          userToCredit.bankCode
        );

        if (
          createPaystackReceipient.isError
          || !createPaystackReceipient?.data?.recipient_code
        ) {
          return {
            message:
              createPaystackReceipient?.error?.statusText
              || "Could not create transfer receipient",
            code:
              createPaystackReceipient?.error?.status
              || HttpStatusCode.INTERNAL_SERVER,
            isError: true,
            error: createPaystackReceipient.error,
          };
        }
        recipientCode = createPaystackReceipient.data.recipient_code;
      }

      // INITIALIZE TRANSFER WITH PAYSTACK
      const trfInitializationResponse = await PaystackHelper.initializeTransfer(
        `${Number(transaction.amount) * 100}`,
        recipientCode,
        transaction.narration,
        transaction.transactionId
      );
      print({ trfInitializationResponse });

      if (
        trfInitializationResponse.isError
        || !trfInitializationResponse?.data?.transfer_code
      ) {
        return {
          message:
            trfInitializationResponse?.error?.statusText
            || "Could not initialize transfer to receipient",
          code:
            trfInitializationResponse?.error?.status
            || HttpStatusCode.INTERNAL_SERVER,
          isError: true,
          recipientCode,
          error: trfInitializationResponse.error,
        };
      }

      // UPDATE TRANSACTION RECORD STATUS FROM PENDING TO SUCCESS/FAILED
      const transactionUpdatePayload = {};

      if (trfInitializationResponse?.data?.status === "success") {
        transactionUpdatePayload.status = "success";
      } else if (trfInitializationResponse?.data?.status === "failed") {
        transactionUpdatePayload.status = "failed";
      }

      await datasource.updateTransaction(
        transaction.userId,
        transaction.transactionId,
        transactionUpdatePayload
      );

      // referenceId = trfInitializationResponse?.data?.transfer_code;
      return {
        ...(trfInitializationResponse?.data || {}),
        recipientCode,
      };
    } catch (error) {
      // print(error);
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
        "transaction.log",
        transactionOptions?.to?.accountName || transaction.userId,
        errorContent
      );
      return errorContent;
    }
  }
}

module.exports = PaymentHandlerInterface;
