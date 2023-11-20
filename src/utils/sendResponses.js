/**
 * @param {res} res
 * @param {code} code
 * @param {errorMessage} errorMessage description of error
 * @return response object {@link res}
 */
module.exports = {
  sendErrorResponse: (res, code, errorMessage) => res.status(code).send({
    status: 'error',
    responsecode: code,
    responsemessage: errorMessage,
  }),
  sendSuccessResponse: (res, code, data) => res.status(code).send({
    status: 'success',
    responsecode: code,
    data,
  })
};
