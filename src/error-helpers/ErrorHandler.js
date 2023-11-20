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
   * @param {Error} err
   * @param {Response} res
   */
  async handleTrustedError(err, res) {
    if (err instanceof BaseError) {
      await sendErrorResponse(res, err.httpCode, err.message);
    }
  },

  handleAxiosError(err, res) {
    return sendErrorResponse(
      res,
      err.response.status || HttpStatusCode.INTERNAL_SERVER,
      `[Axios]: ${err.message}`
    );
  },

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
