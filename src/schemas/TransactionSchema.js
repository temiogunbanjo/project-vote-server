/**
 * @class
 *
 */
class Transaction {
  /**
   * @param {string} firstname
   * @param {string} lastname
   * @param {string} email
   * @param {string} phone
   * @param {string} password
   * @param {Array} role
   * @param {string} referredBy
   */
  constructor(name) {
    this.name = name;
  }
}

module.exports = Transaction;
