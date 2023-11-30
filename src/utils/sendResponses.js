module.exports = {
  /**
   * @param {import("express").Response} res
   * @param {number} code
   * @param {string} errorMessage description of error
   * @return response object {@link res}
   */
  sendErrorResponse: (res, code, errorMessage) => res.status(code).send({
    status: 'error',
    responsecode: code,
    responsemessage: errorMessage,
  }),
  /**
   * @param {import("express").Response} res
   * @param {number} code
   * @param {any} data data to send as success
   * @return response object {@link res}
   */
  sendSuccessResponse: (res, code, data) => res.status(code).send({
    status: 'success',
    responsecode: code,
    data,
  })
};
