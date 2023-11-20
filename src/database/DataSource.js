const fs = require("fs");
const appRoot = require("app-root-path");

const User = require("../schemas/UserSchema");

// eslint-disable-next-line no-unused-vars
const DataRepo = require("./DataRepo");

/**
 * @class DataSource
 */
class DataSource {
  /**
   * @constructor
   * @param {DataRepo} dataRepo;
   */
  constructor(dataRepo) {
    this.datarepo = dataRepo;
  }

  /**
   *
   * @param {object} filters
   * @returns {Promise[]} Promise
   */
  async fetchActivityLogs(filters) {
    let result = await fs.promises.readFile(
      `${appRoot}/logs/adminActivity.log`
    );
    let offset = filters.page < 1 ? 1 : filters.page - 1;
    let { limit } = filters;

    result = result
      .toString()
      .split("\n")
      .filter((value) => value !== "")
      .reverse()
      .map((eachEntry) => JSON.parse(eachEntry))
      .filter(
        (value) => (!filters.adminId ? true : value.adminId === filters.adminId)
          && (!filters.requestMethod
            ? true
            : value.requestMethod === filters.requestMethod)
        // && (
        //   !filters.startDate
        //     ? true
        //     : new Date(value.date).getTime() >= new Date(filters.requestMethod)
        // )
      );

    offset *= limit || 0;
    limit = limit && typeof limit === "number" && !Number.isNaN(limit)
      ? offset + limit
      : -1;

    const totalCount = result.length;
    result = result.slice(offset, limit);
    // console.log(result);
    const activities = {
      rows: result,
      count: totalCount,
    } || this.datarepo.fetchActivityLogs(filters);
    return activities;
  }

  /**
   *
   * @param {object} filters
   * @returns {Promise[]} Promise
   */
  async fetchDeviceAnalytics(filters) {
    delete filters.limit;
    let result = await fs.promises.readFile(`${appRoot}/logs/deviceInfo.log`);
    let offset = filters.page < 1 ? 1 : filters.page - 1;
    let { limit } = filters;

    result = result
      .toString()
      .split("\n")
      .filter((value) => value !== "")
      .reverse()
      .map((eachEntry) => JSON.parse(eachEntry))
      .filter(
        (value) => (!filters.infoId ? true : value.id === filters.infoId)
          && (!filters.requestMethod
            ? true
            : value.requestMethod === filters.requestMethod)
        // && (
        //   !filters.startDate
        //     ? true
        //     : new Date(value.date).getTime() >= new Date(filters.requestMethod)
        // )
      );

    offset *= limit || 0;
    limit = limit && typeof limit === "number" && !Number.isNaN(limit)
      ? offset + limit
      : -1;

    const totalCount = result.length;
    result = !limit ? result : result.slice(offset, limit);
    // console.log(result);
    const activities = {
      rows: result,
      count: totalCount,
    } || this.datarepo.fetchDeviceAnalytics(filters);
    return activities;
  }

  /**
   * @param {User} user Input parameter
   * @return createUser{@link User}
   */
  async createUser(user) {
    if (user instanceof User) {
      return this.datarepo.createUser(user);
    }
    return null;
  }

  /**
   * @param {Config} config configurations for users
   * @returns {Promise<Config>} Promise
   */
  async createUserConfig(config) {
    return this.datarepo.createUserConfig(config);
  }

  /**
   * @method
   * @param {String} searchParameter Get login details of a user
   * @param {String} targetModel The db model to fetch credentials from
   */
  async fetchUserCredentials(searchParameter, targetModel = "user") {
    return this.datarepo.fetchUserCredentials(searchParameter, targetModel);
  }

  /**
   * @param {String} referralCode The db model to fetch credentials from
   */
  async fetchOneUserByReferralCode(referralCode) {
    return this.datarepo.fetchOneUserByReferralCode(referralCode);
  }

  /**
   * @param {String} searchParameter Get details of a user
   * @param {Boolean} playerOnly specifies if the result should contain
   * just players or combination of players and agents
   * @param {{ transaction?: SequelizeTransaction; lock?: boolean }} dbTransaction
   */
  async fetchOneUser(searchParameter, playerOnly = true, dbTransaction = {}, ...others) {
    return this.datarepo.fetchOneUser(
      searchParameter,
      playerOnly,
      dbTransaction,
      ...others
    );
  }

  /**
   * @method
   * @param {String} userId Id of user to fetch config for
   * @return Promise
   */
  async fetchUserConfig(userId) {
    return this.datarepo.fetchUserConfig(userId);
  }

  /**
   * @param {object} filters Get details of a user
   */
  async fetchAllUsers(filters) {
    return this.datarepo.fetchAllUsers(filters);
  }

  /**
   * @param {String} userId userId of user to update
   * @param {object} updateValues fields to update with corresponding update values
   * @param {{ transaction: Transaction } | null} dbTransaction Sequelize transaction
   */
  async updateUser(userId, updateValues, dbTransaction = null) {
    return this.datarepo.updateUser(userId, updateValues, dbTransaction);
  }
}

module.exports = DataSource;
