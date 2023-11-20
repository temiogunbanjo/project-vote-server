/* eslint-disable class-methods-use-this */

const model = require('../../models');
const { print } = require('../utils/HelperUtils');

const { User, ApiKeys } = model;

/**
 *
 * @class DbValidator
 */
class DbValidator {
  /**
   *
   * @method
   * @param {number} phone
   * @returns Promise<Boolean>
   */
  static async fetchUserWithPhone(phone) {
    phone = phone ? phone.replace(/\+234/g, '0') : phone;
    const user = await User.findOne({
      where: { deleted: false, phone },
      attributes: {
        exclude: ['id', 'password'],
      }
    });
    return (!user) ? {} : user.dataValues;
  }

  /**
   *
   * @param {*} keyId
   * @returns object
   */
  static async getApiKey(keyId) {
    const apiKey = await ApiKeys.findOne({
      where: {
        keyId,
      }
    });
    return (!apiKey) ? apiKey : apiKey.dataValues;
  }
}

module.exports = DbValidator;
