/* eslint-disable no-plusplus */
/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
/* eslint-disable class-methods-use-this */
const { Op } = require("sequelize");

const models = require("../../models/index");
const HelperUtils = require("../utils/HelperUtils");

const { customDate } = HelperUtils;
const PatternTemplates = require("../templates/PatternTemplates");

const {
  User,
  Admin,
  Config,
} = models;

/**
 * @class
 */
class DataRepo {
  /** */
  constructor() {
    this.generalAssociationFilters = {
      deleted: false,
    };
    this.associatedUserAttributes = [
      "role",
      "phone",
      "email",
      "status",
      "isAgent",
      "lastname",
      "firstname",
    ];
  }

  /**
   * @param {string | number | boolean} queryParam
   * @param {any[]} stringConditions
   * @param {any[]} uuidConditions
   * @returns any[]
   */
  UUIDOrStringTypeConditionSelector(
    queryParam,
    stringConditions,
    uuidConditions
  ) {
    // const isUUID = PatternTemplates.uuidV4Pattern.test(queryParam);
    const isUUID = !!(queryParam || "").match(PatternTemplates.uuidV4Pattern);
    // console.log(!!queryParam.match(PatternTemplates.uuidV4Pattern));
    // console.log(isUUID);
    return isUUID ? uuidConditions : stringConditions;
  }

  /**
   *
   * @param {UserModel} AUser
   * @returns UserModel
   */
  async createUser(AUser) {
    return User.create(AUser);
  }

  /**
   *
   * @param {*} config
   * @returns Config
   */
  async createUserConfig(config) {
    return Config.create(config);
  }

  /**
   * @param {string} searchParameter
   * @param {string} targetModel
   * @returns Promise
   */
  async fetchUserCredentials(searchParameter, targetModel) {
    const dbModel = targetModel === "user" ? User : Admin;
    return dbModel.findOne({
      where: {
        deleted: false,
        [Op.or]: [{ email: searchParameter }, { phone: searchParameter }],
      },
    });
  }

  /**
   * @param {*} referralCode The db model to fetch credentials from
   */
  async fetchOneUserByReferralCode(referralCode) {
    return User.findOne({
      where: {
        deleted: false,
        isAgent: false,
        referralCode,
      },
    });
  }

  /**
   * @param {string} searchParameter
   * @param {boolean} playerOnly
   * @param {*} dbTransaction
   * @returns Promise
   */
  async fetchOneUser(searchParameter, playerOnly, dbTransaction) {
    const playerOnlyOption = playerOnly === true ? { isAgent: false } : {};

    return User.findOne({
      where: {
        deleted: false,
        ...playerOnlyOption,
        [Op.or]: this.UUIDOrStringTypeConditionSelector(
          searchParameter,
          [{ email: searchParameter }],
          [{ userId: searchParameter }]
        ),
      },
      attributes: { exclude: ["id", "password"] },
      include: [
        {
          model: Config,
          required: false,
        },
      ],
      ...dbTransaction
    });;
  }

  /**
   * @param {*} userId Id of user to fetch config for
   * @return Promise
   */
  async fetchUserConfig(userId) {
    return Config.findOne({
      where: {
        userId,
      },
    });
  }

  /**
   * @param {*} filters
   */
  async fetchAllUsers(filters) {
    if (typeof filters.status === "string") {
      filters.status = filters.status.split(",").map((eachStatus) => {
        eachStatus = eachStatus.trim();
        if (eachStatus === "false" || eachStatus === "true") {
          // eslint-disable-next-line no-eval
          return eval(eachStatus);
        }
        return eachStatus;
      });
    }

    if (typeof filters.role === "string") {
      filters.role = filters.role.split(",");
    }

    if (typeof filters.fields === "string") {
      filters.fields = filters.fields.split(",");
    }

    // Check for optional parameter 'categories', add filter only if exist
    const searchCondition = !filters.search
      ? undefined
      : {
        [Op.or]: [
          { phone: { [Op.like]: `%${filters.search}%` } },
          { firstname: { [Op.like]: `%${filters.search}%` } },
          { lastname: { [Op.like]: `%${filters.search}%` } },
        ],
      };

    // const searchIDCondition = !filters.searchId
    //   ? undefined
    //   : {
    //     [Op.or]: [
    //       { assignedBonusId: { [Op.like]: `%${filters.searchId}%` } },
    //     ],
    //   };

    // Check for optional parameter 'minWalletBalance', add filter only if exist
    const walletBalanceRangeCondition = !filters.minWalletBalance
      ? undefined
      : {
        [Op.or]: [
          {
            walletBalance: {
              [Op.between]: [
                filters.minWalletBalance,
                filters.maxWalletBalance,
              ],
            },
          },
          // eslint-disable-next-line max-len
          {
            commissionBalance: {
              [Op.between]: [
                filters.minWalletBalance,
                filters.maxWalletBalance,
              ],
            },
          },
        ],
      };

    // Check for optional parameter 'status', add filter only if defined
    const statusCondition = !filters.status
      ? undefined
      : {
        status: {
          [Op.in]: filters.status,
        },
      };

    const roleCondition = !filters.role
      ? undefined
      : {
        [Op.or]: filters.role.map((value) => ({ role: value })),
      };

    const lastLoginCondition = !filters.lastLoginDate
      ? undefined
      : {
        lastLogin: {
          [Op.gte]: ((loginDate) => {
            const [day, month, year] = loginDate.split("/").map((value) => {
              value = value.trim();
              return parseInt(value, 10);
            });
            return customDate(new Date(year, month - 1, day).toISOString());
          })(filters.lastLoginDate),
        },
      };

    const dateRange = !filters.startDate
      ? undefined
      : {
        createdAt: {
          [Op.between]: [filters.startDate, filters.endDate],
        },
      };

    // Check for optional parameter 'minCreateDate' and 'maxCreateDate',
    // add filter only if exist
    const creationRangeCondition = !filters.minCreateDate || !filters.maxCreateDate
      ? undefined
      : {
        createdAt: {
          [Op.between]: [filters.minCreateDate, filters.maxCreateDate],
        },
      };

    const SEQUELIZE_QUERY_CONDITIONS = {
      [Op.and]: [
        statusCondition,
        roleCondition,
        searchCondition,
        // searchIDCondition,
        walletBalanceRangeCondition,
        lastLoginCondition,
        dateRange,
        creationRangeCondition,
      ],
    };

    const SEQUELIZE_FIELDS = !filters.fields
      ? { exclude: ["id", "password", "emailVerificationToken"] }
      : filters.fields;

    const offset = filters.page < 1 ? 1 : filters.page - 1;
    const { limit } = filters;

    return User.findAndCountAll({
      distinct: true,
      where: {
        deleted: false,
        isAgent: false,
        ...SEQUELIZE_QUERY_CONDITIONS,
      },
      attributes: SEQUELIZE_FIELDS,
      // filters.orders comes in this format => ['field:ASC', 'field:DESC']
      order: filters.order.map((fieldAndOrderPair) => fieldAndOrderPair.split(":")),
      limit:
        limit && typeof limit === "number" && !Number.isNaN(limit)
          ? limit
          : undefined,
      offset: offset * (limit || 1),
    });
  }

  /**
   * @param {*} userId
   * @param {string} updateValues
   * @param {*} dbTransaction Sequelize transaction
   * @returns Promise
   */
  async updateUser(userId, updateValues, dbTransaction = {}) {
    const result = await User.update(updateValues, {
      where: { userId },
      returning: true,
      ...dbTransaction
    });

    return result;
  }
}

module.exports = DataRepo;
