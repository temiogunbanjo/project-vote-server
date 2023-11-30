const BaseError = require("./BaseError");
const HttpStatusCode = require("./Statuscode");
const SendResponses = require("../utils/sendResponses");

const { sendErrorResponse } = SendResponses;

/**
 * @class
 */
module.exports = {
  /**
   *
   * @param {Error} error
   * @returns Boolean
   */
  isTrustedError(error) {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  },

  /**
   *
   * @param {*} err
   * @returns
   */
  isAxiosError(err) {
    return err.isAxiosError && err.response;
  },

  /**
   *
   * @param {BaseError} err
   * @param {import("express").Response} res
   */
  async handleTrustedError(err, res) {
    if (err instanceof BaseError) {
      await sendErrorResponse(res, Number(err.httpCode), err.message);
    }
  },

  /**
   *
   * @param {import("axios").AxiosError} err
   * @param {import("express").Response} res
   * @returns
   */
  handleAxiosError(err, res) {
    return sendErrorResponse(
      res,
      err?.response?.status || HttpStatusCode.INTERNAL_SERVER,
      `[Axios]: ${err.message}`
    );
  },
  /**
   *
   * @param {any} err
   * @param {import("express").Response} res
   * @returns
   */
  handleGeneralErrors(err, res) {
    let responseMessage = "";
    const isTimedOut = err.message
      && (err.message.toLowerCase().includes("timedout")
      || err.message.toLowerCase().includes("timeout"));

    const isNotNullError = err.message && err.message.toLowerCase().includes("not-null");

    switch (true) {
      case isTimedOut:
        err.status = HttpStatusCode.REQUEST_TIMEOUT;
        responseMessage = "Request timeout! Try again";
        break;

      case isNotNullError:
        err.status = HttpStatusCode.BAD_REQUEST;
        responseMessage = "Incomplete parameters or a non null value was expected!";
        break;

      default:
        responseMessage = err.message
          ? err.message
          : "An error just occured, please try again";
        break;
    }
    return sendErrorResponse(
      res,
      err.status || HttpStatusCode.INTERNAL_SERVER,
      responseMessage
    );
  },
};
