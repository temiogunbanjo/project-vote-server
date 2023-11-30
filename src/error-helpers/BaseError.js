/**
 * @class
 */
class BaseError extends Error {
  /**
   *
   * @param {string} name
   * @param {string} httpCode,
   * @param {string} isOperational,
   * @param {string} description,
   */
  constructor(name, httpCode, isOperational, description) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.httpCode = httpCode;
    this.isOperational = isOperational;
    this.message = description;

    Error.captureStackTrace(this);
  }
}

module.exports = BaseError;
