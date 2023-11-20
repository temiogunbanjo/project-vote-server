/* eslint-disable import/no-named-as-default-member */
// eslint-disable-next-line import/no-named-as-default
const Access = require("../core/roles/AccessHandler");
const ph = require("../utils/hash");
const HelperUtils = require("../utils/HelperUtils");

const {
  SUPER_AGENT, PRINCIPAL_AGENT, ORDINARY_AGENT, CASHIER, PLAYER
} = Access.APP_ROLES;

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
   * @param {Array} role
   * @param {string} referredBy
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

    switch (role) {
      case PRINCIPAL_AGENT.name:
        this.referredBy = null;
        this.maxCreateCount = 100;
        this.canCreateRole = SUPER_AGENT.name;
        break;

      case SUPER_AGENT.name:
        this.maxCreateCount = 50;
        this.canCreateRole = ORDINARY_AGENT.name;
        break;

      case ORDINARY_AGENT.name:
        this.maxCreateCount = 20;
        this.canCreateRole = CASHIER.name;
        break;

      default:
        break;
    }
  }
}

module.exports = User;
