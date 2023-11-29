/* eslint-disable import/no-named-as-default-member */
// eslint-disable-next-line import/no-named-as-default
const Access = require("../core/roles/AccessHandler");
const ph = require("../utils/hash");
const HelperUtils = require("../utils/HelperUtils");

const { PLAYER } = Access.APP_ROLES;

/**
 * @class
 *
 */
class User {
  /**
   * @param {string} firstname
   * @param {string} lastname
   * @param {string} email
   * @param {string} phone
   * @param {string} password
   * @param {string} role
   * @param {string | null} referredBy
   */
  constructor(
    firstname,
    lastname,
    email,
    phone,
    password,
    role = PLAYER.name,
    referredBy = null
  ) {
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email;
    this.phone = phone ? phone.replace(/\+234/g, "0") : null;
    this.avatarUrl = null;
    this.password = ph.encryptV2(password);
    this.status = true;
    this.role = role;
    this.isAgent = role.match(/((.+)agent$)|cashier/g) !== null;
    this.walletBalance = 0.0;
    this.commissionBalance = 0.0;
    this.emailVerificationToken = HelperUtils.generateRandomCharacters(12);
    this.hasVerifiedEmail = false;
    this.referralCode = referredBy === null && !this.isAgent
      ? HelperUtils.generateRandomCharacters(8)
      : null;
    this.referredBy = referredBy;
    this.canCreateRole = null;
    this.maxCreateCount = null;
  }
}

module.exports = User;
