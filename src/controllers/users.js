const fs = require("fs");
const appRootPath = require("app-root-path");
const { SEND_EMAIL } = require("../core/events/eventTypes");

const {
  APP_ROLES,
  VALID_APP_ROLES,
  TOPICS,
  TRANSACTION_TYPES,
  WALLET_TYPES,
  SUSPENSION_TYPES,
  staticUploadPath,
  HttpStatusCode,
  Patterns,
  HtmlTemplates: {
    UserVerificationMailContent,
    USSDUserVerificationMailContent,
    VerificationPage,
  },
  ph,
  createToken,
  verifyToken,
  HelperUtils,
  customDate2: customDate,
  AccessHandler: Access,
  PaymentHandler,
  sendErrorResponse,
  sendSuccessResponse,
  sendEmail,
  sendPushNotificationToTopic,
  unsubscribeFromTopic,
  subscribeToTopic,
  datasource,
  User,
  Admin,
  Transaction,
  BonusHandler,
  createHashedToken,
  verifyHashedToken,
} = require("./imports");
// const { checkIndebtedSiblingAgents } = require("../core/roles/AccessHandler");
const emailEvent = require("../core/events/EmailEvent");
const { ResetPasswordMailContent } = require("../templates/HtmlTemplates");

const webUrl = 'https://white-web.gaim.tech';

module.exports = {
  /**
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchDefaultAvatar(req, res, next) {
    try {
      const uploadedImages = await fs.promises.readdir(
        `${appRootPath}/uploads`
      );
      const defaultAvatar = uploadedImages.find((image) => image.includes("default-avatar"));

      if (!defaultAvatar) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "No default avatar found"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Fetched successfully",
        data: {
          avatarUrl: `${staticUploadPath}/${defaultAvatar}`,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchRoles(req, res, next) {
    try {
      // here
      const { userType } = req.query;
      // if (!userType) {
      //   return sendErrorResponse(res, HttpStatusCode.BAD_REQUEST,
      //     'userType parameter required. userType parameter');
      // }

      const roles = ((type) => {
        switch (true) {
          case !type:
            return Object.keys(Access.APP_ROLES).map(
              (name) => Access.APP_ROLES[name].name
            );

          case ["user", "player"].includes(type):
            return [
              Access.APP_ROLES.PLAYER.name,
              Access.APP_ROLES.INFLUENCER.name,
            ];

          case type === "agent":
            return Access.ALL_AGENTS;

          case type === "admin":
            return Access.ALL_ADMINS;

          default:
            return [];
        }
      })(userType);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Fetched successfully",
        data: roles,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAnalytics(req, res, next) {
    try {
      const analytics = await datasource.fetchAnalytics();

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Fetched analytics successfully",
        data: analytics,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchTicketForAnalysis(req, res, next) {
    try {
      const {
        game,
        // betType,
        // resultType,
        // booster,
        // selections,
        startDate,
        endDate,
      } = req.query;

      if (!startDate.match(Patterns.date_with_slash_pattern)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "startDate parameter should be in the format DD/MM/YYYY"
        );
      }

      if (!endDate.match(Patterns.date_with_slash_pattern)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "endDate parameter should be in the format DD/MM/YYYY"
        );
      }

      const filters = HelperUtils.mapAsFilter({
        ...req.query,
        limit: (10e24).toString(),
        search: game || "",
      });

      if (req.credentials.role !== "admin") {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "You don't have permission to access this endpoint"
        );
      }

      const tickets = await datasource.fetchAllTickets(null, filters);
      const { count, rows } = tickets;

      // let result = await runSearchJob.runSearch(rows);
      // result = result.flatMap((value) => value);
      // HelperUtils.print(result);
      // const updateIndexResponse = await axios.post('http://127.0.0.1:5000/tickets', rows);
      // HelperUtils.print(updateIndexResponse);

      // const matchTickets = await axios.get(`http://127.0.0.1:5000/tickets?search=${betType}`);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Fetched ticket successfully",
        totalCount: count,
        data: rows,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async createUser(req, res, next) {
    try {
      const {
        firstname,
        lastname,
        email,
        phone,
        password,
        role,
        referralCode,
      } = req.body;

      const existingEmail = await datasource.fetchUserCredentials(
        email,
        "user"
      );
      if (existingEmail) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "email exist already"
        );
      }

      if (phone) {
        const existingPhone = await datasource.fetchUserCredentials(
          phone,
          "user"
        );
        if (existingPhone) {
          return sendErrorResponse(
            res,
            HttpStatusCode.BAD_REQUEST,
            "phone number has been used"
          );
        }
      }

      if (role && !VALID_APP_ROLES.includes(role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid role"
        );
      }

      let referredBy = null;
      let extraResponseMessage = "";

      if (referralCode) {
        const referrer = await datasource.fetchOneUserByReferralCode(
          referralCode
        );

        if (!referrer) {
          return sendErrorResponse(
            res,
            HttpStatusCode.NOT_FOUND,
            "Referrer not found"
          );
        }

        referredBy = referrer;
      }

      const user = new User(
        firstname,
        lastname,
        email,
        phone,
        password,
        role,
        referredBy?.userId
      );

      // Create new wallet for user
      const accountCreationResponse = await datasource.createUser(user);

      const existingConfig = await datasource.fetchUserConfig(
        accountCreationResponse.userId
      );
      if (!existingConfig) {
        // Create configs for user
        await datasource.createUserConfig({
          userId: accountCreationResponse.userId,
        });
      }

      // HelperUtils.print(accountCreationResponse, user);
      const emailVerificationLink = `${webUrl}/verify-email?userId=${accountCreationResponse.userId}&verificationCode=${user.emailVerificationToken}&user_type=${user.role}`;

      emailEvent.emit(SEND_EMAIL, {
        data: {
          origin: req.origin || req.originalUrl || req.ip,
          senderEmail: "admin@lotto.com",
          receipientEmail: email,
          subject: "Account Verification",
          content: UserVerificationMailContent(
            HelperUtils.capitalizeFirstLetters(firstname),
            HelperUtils.capitalizeFirstLetters(lastname),
            emailVerificationLink
          ),
        },
      });

      if (!!referralCode && !!referredBy) {
        if (referredBy.role === "influencer" && !!referredBy.assignedBonusId) {
          const assignedBonus = await datasource.fetchSingleBonus(
            referredBy.assignedBonusId
          );

          if (
            !assignedBonus
            || assignedBonus?.status === false
            || assignedBonus?.stopped === true
          ) {
            extraResponseMessage += "Influencer bonus could not be applied!";
          } else {
            await BonusHandler.applyBonusToUser(
              datasource,
              assignedBonus,
              accountCreationResponse
            );
          }
        }
      }

      return sendSuccessResponse(res, HttpStatusCode.CREATED, {
        message: `Created Successfully! ${extraResponseMessage}`,
        // emailVerificationLink,
        data: {
          userId: accountCreationResponse.userId,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          status: user.status,
          role: user.role,
          hasVerifiedEmail: user.hasVerifiedEmail,
          walletBalance: user.walletBalance,
          commissionBalance: user.commissionBalance,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async createUserWithUssd(req, res, next) {
    try {
      const { email, phone } = req.body;
      const password = HelperUtils.generateRandomPassword();
      // HelperUtils.print(password);
      const role = APP_ROLES.PLAYER.name;

      const existingUser = await datasource.fetchOneUser(email, false);
      if (existingUser) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "user with email exist already"
        );
      }

      if (phone) {
        const existingPhone = await datasource.fetchUserCredentials(
          phone,
          "user"
        );
        if (existingPhone) {
          return sendErrorResponse(
            res,
            HttpStatusCode.BAD_REQUEST,
            "phone number has been used"
          );
        }
      }

      if (role && !VALID_APP_ROLES.includes(role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid role"
        );
      }

      const [name] = email.split("@");
      let firstname = "";
      let lastname = "";

      if (name.includes(".")) {
        [firstname, lastname] = name.split(".");
      } else if (name.includes("_")) {
        [firstname, lastname] = name.split("_");
      } else {
        firstname = name;
      }

      const user = new User(
        firstname,
        lastname,
        email,
        phone,
        password,
        role,
        null
      );

      // TODO: Create configs for user
      // TODO: Create new wallet for user

      const accountCreationResponse = await datasource.createUser(user);
      // HelperUtils.print(accountCreationResponse, user);
      const emailVerificationLink = `${webUrl}/verify-email?userId=${accountCreationResponse.userId}&verificationCode=${user.emailVerificationToken}&user_type=${user.role}`;
      // console.log(req);
      const existingConfig = await datasource.fetchUserConfig(
        accountCreationResponse.userId
      );
      if (!existingConfig) {
        // Create configs for user
        await datasource.createUserConfig({
          userId: accountCreationResponse.userId,
        });
      }

      await sendEmail({
        origin: req.origin || req.originalUrl || req.ip,
        senderEmail: "admin@lotto.com",
        receipientEmail: email,
        subject: "Account Verification",
        content: USSDUserVerificationMailContent(
          HelperUtils.capitalizeFirstLetters(firstname),
          HelperUtils.capitalizeFirstLetters(lastname),
          emailVerificationLink,
          password
        ),
      });

      return sendSuccessResponse(res, HttpStatusCode.CREATED, {
        message: "Created Successfully",
        // emailVerificationLink,
        tempPassword: password,
        data: {
          userId: accountCreationResponse.userId,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          status: user.status,
          role: user.role,
          hasVerifiedEmail: user.hasVerifiedEmail,
          walletBalance: user.walletBalance,
          commissionBalance: user.commissionBalance,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async updateUser(req, res, next) {
    try {
      const {
        phone,
        firstname,
        lastname,
        bankCode,
        accountNumber,
        accountName,
      } = req.body;
      const { userId } = req.params;

      if (Access.ALL_AGENTS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "You don't have permission to update user"
        );
      }

      const user = await datasource.fetchOneUser(userId, false);
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      const userConfig = user.Config;
      if (!userConfig) {
        await datasource.createUserConfig({
          userId: user.userId,
        });
      }
      HelperUtils.print(userConfig);

      const fetchBanksResponse = await PaymentHandler.getBanks("nigeria");
      const banks = fetchBanksResponse.data;
      const matchedBank = banks.find((element) => element.code === bankCode);

      if (!matchedBank) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Invalid bankCode"
        );
      }

      const profilePayload = {
        phone,
        firstname,
        lastname,
      };
      const profileUpdateResult = await datasource.updateUser(
        user.userId,
        profilePayload
      );
      if (!profileUpdateResult || profileUpdateResult[1] < 1) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could not update user details"
        );
      }

      const bankDetailsPayload = {
        bankName: matchedBank.name,
        bankCode,
        accountNumber,
        accountName,
      };
      const bankUpdateResult = await datasource.updateConfig(
        user.userId,
        bankDetailsPayload
      );

      HelperUtils.print(bankUpdateResult);
      if (!bankUpdateResult || bankUpdateResult[1] < 1) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could not update bank details"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "profile updated successfully",
        data: {
          ...profilePayload,
          ...bankDetailsPayload,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async updateUserAvatar(req, res, next) {
    try {
      const { userId } = req.params;

      const avatarUrl = req.file
        ? `${staticUploadPath}/${req.file.filename}`
        : "";

      if (Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Only players and agents allowed"
        );
      }

      const user = await datasource.fetchOneUser(userId, false);
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      const profilePayload = { avatarUrl };
      const profileUpdateResult = await datasource.updateUser(
        user.userId,
        profilePayload
      );
      if (!profileUpdateResult || profileUpdateResult[1] < 1) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could not update user avatar"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Avatar updated successfully",
        data: {
          ...profilePayload,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async delinkAffiliate(req, res, next) {
    try {
      const { affiliateUserId } = req.body;

      if (!Access.CAN_DELINK_AFFILIATE.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Only players can delink an affiliate"
        );
      }

      const currentUser = await datasource.fetchOneUser(req.user.userId);
      if (!currentUser) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current user details not found"
        );
      }

      const affiliateUser = await datasource.fetchOneUser(
        affiliateUserId,
        false
      );
      if (!affiliateUser) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      const isDownline = currentUser.downlines
        && !!currentUser.downlines.find(
          (downline) => downline.userId === affiliateUser.userId
        );

      if (!isDownline) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "affiliate user is not a downline"
        );
      }

      const updateAffiliateUser = await datasource.updateUser(affiliateUserId, {
        referredBy: null,
      });
      if (!updateAffiliateUser || updateAffiliateUser[1] < 1) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could delink affiliate user"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Affiliate delinked succesfully",
        data: {},
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async sendVerificationMail(req, res, next) {
    try {
      const { userId } = req.body;

      const existingUser = await datasource.fetchOneUser(userId, false);
      // HelperUtils.print(user);
      if (!existingUser) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      if (existingUser.hasVerifiedEmail) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Email has already been verified"
        );
      }

      const verificationCode = HelperUtils.generateRandomCharacters(32);
      const updateTokenResponse = await datasource.updateUser(
        existingUser.userId,
        {
          emailVerificationToken: verificationCode,
        }
      );

      if (!updateTokenResponse) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured! Please try again."
        );
      }
      const emailVerificationLink = `${webUrl}/verify-email?userId=${existingUser.userId}&verificationCode=${existingUser.emailVerificationToken}&user_type=${existingUser.role}`;

      await sendEmail({
        origin: req.origin || req.originalUrl || req.ip,
        senderEmail: "admin@lotto.com",
        receipientEmail: existingUser.email,
        subject: "Account Verification",
        content: UserVerificationMailContent(
          HelperUtils.capitalizeFirstLetters(existingUser.firstname),
          HelperUtils.capitalizeFirstLetters(existingUser.lastname),
          emailVerificationLink
        ),
      });

      return sendSuccessResponse(res, HttpStatusCode.CREATED, {
        message: "Email verification link has been sent to your primary email",
        emailVerificationLink,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async loginUser(req, res, next) {
    try {
      const { email, phone, password } = req.body;

      const searchParam = !email ? phone : email;
      const user = await datasource.fetchUserCredentials(searchParam);
      // HelperUtils.print({ user });
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      // If player account is suspended
      if (!user.isAgent && user.status === false) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Account has been suspended. Contact support for more information"
        );
      }

      if (!ph.compareHashAndString(user.password, password)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.UNAUTHORIZED,
          "incorrect login"
        );
      }

      const userValues = await datasource.fetchOneUser(user.email, false);
      // HelperUtils.print({ userValues });

      const payload = {
        userId: userValues.userId,
        firstname: userValues.firstname,
        lastname: userValues.lastname,
        isAgent: userValues.isAgent,
        canCreateRole: userValues.canCreateRole,
        maxCreateCount: userValues.maxCreateCount,
        role: userValues.role,
        lastLogin: userValues.lastLogin,
      };

      if (userValues.isAgent) {
        // const hasIndebtedSiblingAgents = await checkIndebtedSiblingAgents(
        //   datasource,
        //   userValues
        // );

        // HelperUtils.print({ hasIndebtedSiblingAgents });
        // if (hasIndebtedSiblingAgents === null) {
        //   return sendErrorResponse(
        //     res,
        //     HttpStatusCode.INTERNAL_SERVER,
        //     "An error occurred"
        //   );
        // }

        // if (hasIndebtedSiblingAgents) {
        //   return sendErrorResponse(
        //     res,
        //     HttpStatusCode.FORBIDDEN,
        //     `One or more of your upline's ${
        //       userValues.role
        //     } is currently owing. Contact your direct upline for resolution`
        //   );
        // }

        payload.hasMinimumDailyWalletBalance = HelperUtils.checkDailyWalletThreshold(userValues);

        if (payload.hasMinimumDailyWalletBalance) {
          await datasource.updateUser(userValues.userId, {
            lastLogin: customDate().toISOString(),
          });
        }
      } else {
        await datasource.updateUser(userValues.userId, {
          lastLogin: customDate().toISOString(),
        });
      }

      // HelperUtils.print(payload);

      await datasource.incrementLoginCount(userValues.userId);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Logged in successfully",
        data: {
          userId: payload.userId,
          token: createToken(payload),
          expiresAt: new Date(Date.now() + 3600000 * 24).toUTCString(),
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async refreshLogin(req, res, next) {
    try {
      if (Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Only a players and agents allowed"
        );
      }

      const userValues = await datasource.fetchOneUser(req.user.userId, false);
      if (!userValues) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      // If player account is suspended
      // if (!userValues.isAgent && userValues.status === false) {
      //   return sendErrorResponse(
      //     res,
      //     HttpStatusCode.FORBIDDEN,
      //     'Account has been suspended. Contact support for more information'
      //   );
      // }

      const payload = {
        userId: userValues.userId,
        firstname: userValues.firstname,
        lastname: userValues.lastname,
        isAgent: userValues.isAgent,
        canCreateRole: userValues.canCreateRole,
        maxCreateCount: userValues.maxCreateCount,
        role: userValues.role,
        lastLogin: userValues.lastLogin,
      };

      if (userValues.isAgent) {
        payload.hasMinimumDailyWalletBalance = HelperUtils.checkDailyWalletThreshold(userValues);

        if (payload.hasMinimumDailyWalletBalance) {
          await datasource.updateUser(userValues.userId, {
            lastLogin: customDate().toISOString(),
          });
        }
      } else {
        await datasource.updateUser(userValues.userId, {
          lastLogin: customDate().toISOString(),
        });
      }

      HelperUtils.print(payload);

      await datasource.incrementLoginCount(userValues.userId);
      // await datasource.sendNotificationToUser(userValues.userId, {
      //   title: 'Bet9ja',
      //   content: 'Logging in....',
      // });

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Log in refreshed successfully",
        data: {
          userId: payload.userId,
          token: createToken(payload),
          expiresAt: new Date(Date.now() + 3600000 * 24).toUTCString(),
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async subscribeToPushNotification(req, res, next) {
    try {
      const { deviceRegToken } = req.body;
      const { userId } = !req.body.userId ? req.user : req.body;

      if (!userId) {
        return sendErrorResponse(
          res,
          HttpStatusCode.UNAUTHORIZED,
          "User id required"
        );
      }

      const user = await datasource.fetchOneUser(userId, false);
      // HelperUtils.print(user);
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      // If player account is suspended
      if (!user.isAgent && user.status === false) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Account has been suspended. Contact support for more information"
        );
      }

      const userConfig = await datasource.fetchUserConfig(userId);
      if (!userConfig) {
        await datasource.createUserConfig({
          userId,
          deviceId: deviceRegToken,
        });
      } else {
        await datasource.updateConfig(userId, {
          deviceId: deviceRegToken,
        });
      }

      // Subscribe to related topics
      const userSpecificTopic = (() => {
        if (Access.ALL_ADMINS.includes(req.user.role)) {
          return TOPICS.admin;
        }
        if (Access.ALL_AGENTS.includes(req.user.role)) {
          return TOPICS.agent;
        }
        if (
          [
            Access.APP_ROLES.PLAYER.name,
            Access.APP_ROLES.INFLUENCER.name,
          ].includes(req.user.role)
        ) {
          return TOPICS.player;
        }

        return null;
      })();

      HelperUtils.print({ userSpecificTopic });

      const generalSubscriptionResponse = await subscribeToTopic(
        TOPICS.general,
        [deviceRegToken]
      );
      if (generalSubscriptionResponse.errors.length > 0) {
        HelperUtils.print(generalSubscriptionResponse.errors);
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured! Please try again."
        );
      }

      if (userSpecificTopic) {
        const specificSubscriptionResponse = await subscribeToTopic(
          userSpecificTopic,
          [deviceRegToken]
        );

        if (specificSubscriptionResponse.errors.length > 0) {
          HelperUtils.print(specificSubscriptionResponse.errors);
          return sendErrorResponse(
            res,
            HttpStatusCode.INTERNAL_SERVER,
            "An error occured! Please try again."
          );
        }
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Subscribed successfully",
        data: {
          userId,
          deviceId: deviceRegToken,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async unsubscribeToPushNotification(req, res, next) {
    try {
      const { userId } = !req.body.userId ? req.user : req.body;

      if (!userId) {
        return sendErrorResponse(
          res,
          HttpStatusCode.UNAUTHORIZED,
          "User id required"
        );
      }

      const user = await datasource.fetchOneUser(userId, false);
      // HelperUtils.print(user);
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      // If player account is suspended
      if (!user.isAgent && user.status === false) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Account has been suspended. Contact support for more information"
        );
      }

      const userConfig = await datasource.fetchUserConfig(userId);
      const deviceRegToken = userConfig.deviceId;
      if (!userConfig) {
        await datasource.createUserConfig({
          userId,
          deviceId: null,
        });
      } else {
        await datasource.updateConfig(userId, { deviceId: null });
      }

      // Unsubscribe from related topics
      const userSpecificTopic = (() => {
        if (Access.ALL_ADMINS.includes(req.user.role)) {
          return TOPICS.admin;
        }
        if (Access.ALL_AGENTS.includes(req.user.role)) {
          return TOPICS.agent;
        }
        if (
          [
            Access.APP_ROLES.PLAYER.name,
            Access.APP_ROLES.INFLUENCER.name,
          ].includes(req.user.role)
        ) {
          return TOPICS.player;
        }

        return null;
      })();

      await unsubscribeFromTopic(TOPICS.general, [deviceRegToken]);
      if (userSpecificTopic) {
        await unsubscribeFromTopic(userSpecificTopic, [deviceRegToken]);
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Unsubscribed successfully",
        data: {
          userId,
          deviceId: null,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async adminSendPushNotification(req, res, next) {
    try {
      //
      const { message, title, group } = req.body;

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Only admins allowed"
        );
      }

      const response = await sendPushNotificationToTopic(group, {
        title,
        content: message,
      });

      if (!response) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Error sending notification"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Notification sent successfully",
        data: response,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async validateToken(req, res, next) {
    try {
      let payload = null;
      const { token } = req.query;
      // HelperUtils.print(Date.now());
      try {
        if (!token) {
          return sendErrorResponse(
            res,
            HttpStatusCode.BAD_REQUEST,
            "invalid token"
          );
        }
        payload = verifyToken(token);
      } catch (error) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          error.message
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "token verified successfully",
        data: payload,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async verifyEmail(req, res, next) {
    try {
      const { userId, verificationCode, source } = req.query;

      const user = await datasource.fetchOneUser(userId, false);
      HelperUtils.print(user);
      if (!userId || !user || !verificationCode) {
        if (!!source && source === "email") {
          return res
            .status(HttpStatusCode.OK)
            .send(
              VerificationPage(
                "Invalid Verification Link",
                HttpStatusCode.BAD_REQUEST,
                "#"
              )
            );
        }

        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid verification link"
        );
      }

      if (user.hasVerifiedEmail) {
        if (!!source && source === "email") {
          return res
            .status(HttpStatusCode.OK)
            .send(
              VerificationPage(
                "Email Has Been Verified!",
                HttpStatusCode.BAD_REQUEST,
                `${process.env.BNJ_WEB_BASE_URL}/login`
              )
            );
        }

        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Email has been verified already"
        );
      }

      if (
        !(
          user.emailVerificationToken === verificationCode
          && user.userId === userId
        )
      ) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid verification link"
        );
      }

      const updateUserVerificationStatus = await datasource.updateUser(
        user.userId,
        { hasVerifiedEmail: true, emailVerificationToken: null }
      );
      if (!updateUserVerificationStatus) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could not verify email"
        );
      }

      if (!!source && source === "email") {
        return res
          .status(HttpStatusCode.OK)
          .send(
            VerificationPage(
              "Your Account Has Been Verified Successfully",
              HttpStatusCode.OK,
              `${process.env.BNJ_WEB_BASE_URL}/login`
            )
          );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "email verified successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async resetUserPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await datasource.fetchOneUser(email, false);
      // HelperUtils.print(user);
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      const payload = {
        userId: user.userId
      };

      const passwordResetLink = `${webUrl}/recover-password?token=${createHashedToken(payload, '3h')}`;
      const fullName = `${
        HelperUtils.capitalizeFirstLetters(user.firstname)
      } ${
        HelperUtils.capitalizeFirstLetters(user.lastname)
      }`;

      await sendEmail({
        senderEmail: "admin@lotto.com",
        receipientEmail: email,
        subject: "Reset Password Confirmation",
        content: ResetPasswordMailContent(fullName, passwordResetLink)
      });

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Email sent successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async updateUserPassword(req, res, next) {
    try {
      const { newPassword, token } = req.body;

      const userInfo = verifyHashedToken(token, '3h');
      // console.log({ userInfo, d: Date.now() / 1000 });

      if (!userInfo || !userInfo?.userId) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid token"
        );
      }

      if (userInfo?.exp < (Date.now() / 1000)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Expired token"
        );
      }

      const validuser = await datasource.fetchOneUser(userInfo.userId, false);
      if (!validuser) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid user"
        );
      }

      const passwordUpdateResult = await datasource.updateUser(
        validuser.userId,
        {
          password: ph.encryptV2(newPassword),
        }
      );
      if (!passwordUpdateResult) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "password reset successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchUser(req, res, next) {
    try {
      const { userId } = req.params;
      const searchParam = req.user.userId || req.user.adminId || null;

      const currentUser = await datasource.fetchOneUser(searchParam, false);

      const canAccessUserDetails = Access.ALL_ADMINS.includes(req.user.role)
        || (currentUser && currentUser.userId === userId)
        || (currentUser
          && currentUser.downlines.findIndex((user) => user.userId === userId)
            > -1);

      if (!canAccessUserDetails) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Request denied"
        );
      }

      const user = await datasource.fetchOneUser(userId);
      // HelperUtils.print(user);
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      const payload = {
        userId: user.userId,
        firstname: user.firstname,
        lastname: user.lastname,
        avatarUrl: user.avatarUrl,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance,
        commissionBalance: user.commissionBalance,
        bonusBalance: user.bonusWallet,
        bonusStatus: user.bonusStatus,
        hasVerifiedEmail: user.hasVerifiedEmail,
        status: user.status,
        role: user.role,
        referredBy: user.referredBy,
        referralCode: user.referralCode,
        multiplier: user.multiplier,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        bankName: user.bankName,
        bankCode: user.bankCode,
        accountNumber: user.accountNumber,
        accountName: user.accountName,
        downlines: user.downlines,
        AssignedBonus: user.Bonus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // HelperUtils.print(payload);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "user found successfully",
        data: payload,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchCurrentUser(req, res, next) {
    try {
      if (Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Only players and agents allowed"
        );
      }

      const searchParam = req.user.userId || req.user.adminId || "n/a";

      const currentUser = await datasource.fetchOneUser(searchParam, false);
      // console.log(currentUser);

      if (!currentUser) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      const payload = {
        userId: currentUser.userId,
        firstname: currentUser.firstname,
        lastname: currentUser.lastname,
        avatarUrl: currentUser.avatarUrl,
        email: currentUser.email,
        phone: currentUser.phone,
        walletBalance: currentUser.walletBalance,
        commissionBalance: currentUser.commissionBalance,
        bonusBalance: currentUser.bonusWallet,
        bonusStatus: currentUser.bonusStatus,
        hasVerifiedEmail: currentUser.hasVerifiedEmail,
        status: currentUser.status,
        role: currentUser.role,
        isAgent: currentUser.isAgent,
        referredBy: currentUser.referredBy,
        referralCode: currentUser.referralCode,
        multiplier: currentUser.multiplier,
        dailyLimit: currentUser.dailyLimit,
        lastLogin: currentUser.lastLogin,
        loginCount: currentUser.loginCount,
        bankName: currentUser.bankName,
        bankCode: currentUser.bankCode,
        accountNumber: currentUser.accountNumber,
        accountName: currentUser.accountName,
        downlines: currentUser.downlines,
        AssignedBonus: currentUser.Bonus,
        excludedAgentBetTypes: JSON.parse(currentUser?.Config?.excludedAgentBetTypes || '[]'),
        createdAt: currentUser.createdAt,
        updatedAt: currentUser.updatedAt,
      };

      // HelperUtils.print(payload);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "User retrieved successfully",
        data: payload,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAllUsers(req, res, next) {
    try {
      const filters = HelperUtils.mapAsFilter(req.query);

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "You don't have permission to access this endpoint"
        );
      }

      if (filters.status) {
        if (typeof filters.status === "string") {
          filters.status = filters.status.split(",");
        }

        filters.status = filters.status.map(
          (value) => !!(value === "active" || value === "true")
        );
      }

      const users = await datasource.fetchAllUsers(filters);
      const { count, rows } = users;
      HelperUtils.print(users);
      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: `Found ${rows ? rows.length : 0} results`,
        totalCount: count,
        data: rows,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async addRoleToUser(req, res, next) {
    try {
      const { role } = req.body;
      const { userId } = req.params;

      const user = await datasource.fetchOneUser(userId);
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      const payload = { role };
      const profileUpdateResult = await datasource.updateUser(
        user.userId,
        payload
      );
      if (!profileUpdateResult) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "role updated successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async exportAllUsers(req, res, next) {
    try {
      if (!Access.CAN_EXPORT.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }
      const filters = HelperUtils.mapAsFilter(req.query);

      if (filters.status) {
        filters.status = filters.status.map(
          (value) => !!(value === "active" || value === "true")
        );
      }

      delete filters.limit;
      // HelperUtils.print({filters});
      const users = await datasource.fetchAllUsers(filters);
      // HelperUtils.print({users});

      const downloadUrl = HelperUtils.arrayToCSV(
        users.map((eachUser) => eachUser.dataValues)
      );
      // return res.end(`<a href='${downloadUrl}' download='users.csv'>users.csv</a>`);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: `Found ${users ? users.length : 0} results`,
        data:
          users.length === 0
            ? null
            : {
              name: "users.csv",
              url: downloadUrl,
            },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async enableOrDisableUser(req, res, next) {
    try {
      const { status, userId } = req.body;

      if (!Access.CAN_ACTIVATE_DEACTIVATE_USERS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      const user = await datasource.fetchOneUser(userId);
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      const payload = { status };
      const profileUpdateResult = await datasource.updateUser(
        user.userId,
        payload
      );
      if (!profileUpdateResult) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: `profile ${status ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchUserAnalytics(req, res, next) {
    try {
      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // HelperUtils.print({filters});
      const analytics = await datasource.fetchUserAnalytics();

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Fetched analytics successfully",
        data: analytics,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async createAgent(req, res, next) {
    try {
      const {
        firstname,
        lastname,
        email,
        phone,
        password,
        role,
        dailyLimit,
        excludedAgentBetTypes = []
      } = req.body;

      // CHECK IF THE CURRENT USER IS ALLOWED TO CREATE AN AGENT
      if (!Access.CAN_CREATE_AGENTS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      /* ====[ VALIDATE PARAMETERS AND CHECK FOR EXISTING PARAMETER ]==== */
      // CHECK IF ROLE IS A VALID ROLE
      if (!Access.ALL_AGENTS.includes(role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid role for agent"
        );
      }

      // CHECK IF AGENT WITH SIMILAR EMAIL EXISTS
      const existingAgent = await datasource.fetchUserCredentials(
        email,
        "user"
      );
      if (existingAgent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "email exist already"
        );
      }

      // CHECK IF AGENT WITH SIMILAR PHONE EXISTS
      if (phone) {
        const existingUserWithPhone = await datasource.fetchUserCredentials(
          phone,
          "user"
        );
        if (existingUserWithPhone) {
          return sendErrorResponse(
            res,
            HttpStatusCode.BAD_REQUEST,
            "phone number has been used"
          );
        }
      }

      if (!Array.isArray(excludedAgentBetTypes)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "ExcludedAgentBetTypes parameter should be an array of bet types"
        );
      }

      const referredBy = !req.user.isAgent
        ? req.body.referredBy
        : req.user.userId;

      HelperUtils.print(referredBy);

      let currentCreateCount = req.user.maxCreateCount;

      if (req.user.isAgent) {
        // IF CURRENT AUTHENTICATED USER IS AN AGENT
        const referrerAgent = await datasource.fetchOneAgent(referredBy);
        if (!referrerAgent) {
          return sendErrorResponse(
            res,
            HttpStatusCode.NOT_FOUND,
            "authenticated agent details not found"
          );
        }

        const { canCreateRole, maxCreateCount } = referrerAgent;
        currentCreateCount = maxCreateCount;

        if (
          !VALID_APP_ROLES.filter(
            (v) => v.endsWith("agent") || v === "cashier"
          ).includes(role)
        ) {
          return sendErrorResponse(
            res,
            HttpStatusCode.BAD_REQUEST,
            "invalid role for agent"
          );
        }

        const creatorOfRoles = {
          principalagent: null,
          superagent: APP_ROLES.PRINCIPAL_AGENT.name.replace("agent", " agent"),
          ordinaryagent: APP_ROLES.SUPER_AGENT.name.replace("agent", " agent"),
          cashier: APP_ROLES.ORDINARY_AGENT.name.replace("agent", " agent"),
        };

        if (role !== canCreateRole) {
          return sendErrorResponse(
            res,
            HttpStatusCode.FORBIDDEN,
            `Only admin or ${creatorOfRoles[role]} can create ${role.replace(
              "agent",
              " agents"
            )}`
          );
        }
      } else if (Access.ALL_ADMINS.includes(req.user.role)) {
        if (role !== Access.APP_ROLES.PRINCIPAL_AGENT.name) {
          return sendErrorResponse(
            res,
            HttpStatusCode.FORBIDDEN,
            "Admin can only create principal agent"
          );
        }
      } else {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Only agents and admins allowed"
        );
      }

      const agent = new User(
        firstname,
        lastname,
        email,
        phone,
        password,
        role,
        referredBy
      );

      const accountCreationResponse = await datasource.createAgent(agent, {
        userId: !req.user.isAgent ? null : referredBy,
        remainingCreateCount: currentCreateCount - 1,
      });

      if (!accountCreationResponse) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Account creation failed. Try again later"
        );
      }

      const existingConfig = await datasource.fetchUserConfig(
        accountCreationResponse.userId
      );
      if (!existingConfig) {
        // Create configs for user
        await datasource.createUserConfig({
          userId: accountCreationResponse.userId,
          dailyLimit: dailyLimit || 0,
          excludedAgentBetTypes: JSON.stringify(excludedAgentBetTypes)
        });
      }

      // HelperUtils.print(accountCreationResponse, user);
      const emailVerificationLink = `${webUrl}/verify-email?userId=${accountCreationResponse.userId}&verificationCode=${agent.emailVerificationToken}&user_type=${agent.role}`;

      await sendEmail({
        origin: req.origin || req.originalUrl || req.ip,
        senderEmail: "admin@lotto.com",
        receipientEmail: email,
        subject: "Account Verification",
        content: UserVerificationMailContent(
          HelperUtils.capitalizeFirstLetters(firstname),
          HelperUtils.capitalizeFirstLetters(lastname),
          emailVerificationLink
        ),
      });

      return sendSuccessResponse(res, HttpStatusCode.CREATED, {
        message: "Created Successfully",
        // emailVerificationLink,
        data: {
          userId: accountCreationResponse.userId,
          firstname: agent.firstname,
          lastname: agent.lastname,
          email: agent.email,
          phone: agent.phone,
          status: agent.status,
          canCreateRole: accountCreationResponse.canCreateRole,
          maxCreateCount: accountCreationResponse.maxCreateCount,
          role: agent.role,
          referredBy: agent.referredBy,
          hasVerifiedEmail: agent.hasVerifiedEmail,
          dailyLimit: dailyLimit || 0,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAgent(req, res, next) {
    try {
      const { userId } = req.params;
      const searchParam = req.user.userId || req.user.adminId || null;

      const currentAgent = await datasource.fetchOneAgent(searchParam);

      // HelperUtils.print(currentAgent.downlines);
      const canAccessUserDetails = Access.ALL_ADMINS.includes(req.user.role)
        || (currentAgent && currentAgent.userId === userId)
        || (currentAgent
          && currentAgent.downlines.findIndex((user) => user.userId === userId)
            > -1);

      if (!canAccessUserDetails) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Request denied"
        );
      }

      const agent = await datasource.fetchOneAgent(userId);
      if (!agent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "agent not found"
        );
      }
      // HelperUtils.print(agent);
      const payload = {
        userId: agent.userId,
        firstname: agent.firstname,
        lastname: agent.lastname,
        email: agent.email,
        phone: agent.phone,
        avatarUrl: agent.avatarUrl,
        walletBalance: agent.walletBalance,
        commissionBalance: agent.commissionBalance,
        bonusBalance: agent.bonusWallet,
        hasVerifiedEmail: agent.hasVerifiedEmail,
        status: agent.status,
        role: agent.role,
        canCreateRole: agent.canCreateRole,
        maxCreateCount: agent.maxCreateCount,
        referredBy: agent.referredBy,
        referralCode: agent.referralCode,
        multiplier: agent.multiplier,
        lastLogin: agent.lastLogin,
        loginCount: agent.loginCount,
        bankName: agent.bankName,
        bankCode: agent.bankCode,
        accountNumber: agent.accountNumber,
        accountName: agent.accountName,
        dailyLimit: agent.dailyLimit,
        downlines: agent.downlines,
        excludedAgentBetTypes: JSON.parse(agent?.Config?.excludedAgentBetTypes || '[]'),
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      };

      payload.hasMinimumDailyWalletBalance = HelperUtils.checkDailyWalletThreshold(agent);

      // HelperUtils.print(payload);
      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "agent found successfully",
        data: payload,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAllAgents(req, res, next) {
    try {
      const filters = HelperUtils.mapAsFilter(req.query);

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "You don't have permission to access this endpoint"
        );
      }

      if (filters.status) {
        if (typeof filters.status === "string") {
          filters.status = filters.status.split(",");
        }

        filters.status = filters.status.map(
          (value) => !!(value === "active" || value === "true")
        );
      }

      const agentList = await datasource.fetchAllAgents(filters);
      const { count, rows } = agentList;
      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: `Found ${rows ? rows.length : 0} results`,
        totalCount: count,
        data: rows,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async updateAgent(req, res, next) {
    try {
      const {
        phone,
        firstname,
        lastname,
        bankCode,
        accountNumber,
        accountName,
        dailyLimit,
        excludedAgentBetTypes
      } = req.body;
      const { userId } = req.params;

      // IF USER IS NOT AN AGENT OR ADMIN
      if (
        !Access.ALL_AGENTS.includes(req.user.role)
        && !Access.ALL_ADMINS.includes(req.user.role)
      ) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Only agents and admins allowed"
        );
      }

      // FETCH TARGET AGENT PROFILE
      const agent = await datasource.fetchOneAgent(userId);
      if (!agent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "agent not found"
        );
      }

      HelperUtils.print({
        curUserId: req.user.userId,
        referedBy: agent.referredBy,
      });

      // MAKE SURE ONLY AN UPLINE OR AN ADMIN CAN UPDATE PROFILE
      if (
        req.user.userId !== agent.referredBy
        && !Access.ALL_ADMINS.includes(req.user.role)
      ) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Only an upline or an admin can update agent profile"
        );
      }

      if (excludedAgentBetTypes && !Array.isArray(excludedAgentBetTypes)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "ExcludedAgentBetTypes parameter should be an array of bet types"
        );
      }

      // ===================================
      const agentConfig = agent.Config;
      if (!agentConfig) {
        await datasource.createUserConfig({
          userId: agent.userId,
          dailyLimit: dailyLimit || 0,
          excludedAgentBetTypes: JSON.stringify(excludedAgentBetTypes)
        });
      }
      HelperUtils.print(agentConfig);

      // ===================================
      const profilePayload = {
        phone,
        firstname,
        lastname,
      };

      const profileUpdateResult = await datasource.updateAgent(
        agent.userId,
        profilePayload
      );
      if (!profileUpdateResult || profileUpdateResult[1] < 1) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could not update agent details"
        );
      }

      let bankName;
      const fetchBanksResponse = await PaymentHandler.getBanks("nigeria");
      const banks = fetchBanksResponse.data;

      if (bankCode) {
        const matchedBank = banks.find((element) => element.code === bankCode);

        if (!matchedBank) {
          return sendErrorResponse(
            res,
            HttpStatusCode.BAD_REQUEST,
            "Invalid bankCode"
          );
        }

        bankName = matchedBank.name;
      }

      const bankDetailsPayload = {
        bankName,
        bankCode,
        accountNumber,
        accountName,
        dailyLimit: dailyLimit || 0,
      };

      if (excludedAgentBetTypes) {
        bankDetailsPayload.excludedAgentBetTypes = JSON.stringify(excludedAgentBetTypes);
      }

      const bankUpdateResult = await datasource.updateConfig(
        agent.userId,
        bankDetailsPayload
      );

      HelperUtils.print(bankUpdateResult);
      if (!bankUpdateResult || bankUpdateResult[1] < 1) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could not update bank details"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "agent profile updated successfully",
        data: {
          ...profilePayload,
          ...bankDetailsPayload,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async updateAgentPasswordAndPin(req, res, next) {
    try {
      const { newPassword, newTransactionPin } = req.body;

      const { userId } = req.user;

      const validuser = await datasource.fetchOneUser(userId, false);
      if (!validuser) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid user"
        );
      }

      if (newPassword) {
        const passwordUpdateResult = await datasource.updateUser(
          validuser.userId,
          {
            password: ph.encryptV2(newPassword),
          }
        );
        if (!passwordUpdateResult) {
          return sendErrorResponse(
            res,
            HttpStatusCode.INTERNAL_SERVER,
            "An error occured"
          );
        }
      }

      if (newTransactionPin) {
        const pinUpdateResult = await datasource.updateConfig(
          validuser.userId,
          {
            transactionPin: newTransactionPin,
          }
        );
        if (!pinUpdateResult) {
          return sendErrorResponse(
            res,
            HttpStatusCode.INTERNAL_SERVER,
            "An error occured"
          );
        }
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "password and pin reset successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async updateAgentMultiplier(req, res, next) {
    try {
      const { userId } = req.params;
      const { multiplier } = req.body;

      // CHECK IF CURRENT AUTHENTICATED USER IS NOT AN AGENT OR ADMIN
      if (!Access.CAN_MODIFY_MULTIPLIERS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `Only ${Access.APP_ROLES.SUPER_ADMIN.name} and ${Access.APP_ROLES.RISK_MANAGER.name} allowed`
        );
      }

      // FETCH TARGET AGENT PROFILE
      const agent = await datasource.fetchOneAgent(userId);
      if (!agent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "agent not found"
        );
      }

      HelperUtils.print(agent.referredBy);

      const profileUpdateResult = await datasource.updateAgent(agent.userId, {
        multiplier,
      });
      if (!profileUpdateResult) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured"
        );
      }

      const [, updatedCount] = profileUpdateResult;
      if (!updatedCount || updatedCount === 0) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "No changes made to agent profile"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "agent profile updated successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async sendVerificationMailToAgents(req, res, next) {
    try {
      const { userId } = req.body;

      const existingAgent = await datasource.fetchOneAgent(userId);
      // HelperUtils.print(user);
      if (!existingAgent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "Agent not found"
        );
      }

      if (existingAgent.hasVerifiedEmail) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Email has already been verified"
        );
      }

      const verificationCode = HelperUtils.generateRandomCharacters(32);
      const updateTokenResponse = await datasource.updateAgent(
        existingAgent.userId,
        {
          emailVerificationToken: verificationCode,
        }
      );

      if (!updateTokenResponse) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured! Please try again."
        );
      }
      const emailVerificationLink = `${webUrl}/verify-email?userId=${existingAgent.userId}&verificationCode=${verificationCode}&user_type=${existingAgent.role}`;

      await sendEmail({
        origin: req.origin || req.originalUrl || req.ip,
        senderEmail: "admin@lotto.com",
        receipientEmail: existingAgent.email,
        subject: "Account Verification",
        content: UserVerificationMailContent(
          HelperUtils.capitalizeFirstLetters(existingAgent.firstname),
          HelperUtils.capitalizeFirstLetters(existingAgent.lastname),
          emailVerificationLink
        ),
      });

      return sendSuccessResponse(res, HttpStatusCode.CREATED, {
        message: "Email verification link has been sent to your primary email",
        emailVerificationLink,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async verifyAgentEmail(req, res, next) {
    try {
      const { userId, verificationCode, source } = req.query;

      const agent = await datasource.fetchOneAgent(userId);
      // HelperUtils.print(adminId, admin, verificationCode);
      if (!userId || !agent || !verificationCode) {
        if (!!source && source === "email") {
          return res
            .status(HttpStatusCode.OK)
            .send(
              VerificationPage(
                "Invalid Verification Link",
                HttpStatusCode.BAD_REQUEST,
                "#"
              )
            );
        }

        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid verification link"
        );
      }

      if (agent.hasVerifiedEmail) {
        if (!!source && source === "email") {
          return res
            .status(HttpStatusCode.OK)
            .send(
              VerificationPage(
                "Email Has Been Verified!",
                HttpStatusCode.BAD_REQUEST,
                `${process.env.BNJ_WEB_BASE_URL}/login`
              )
            );
        }

        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Email has been verified already"
        );
      }

      if (
        !(
          agent.emailVerificationToken === verificationCode
          && agent.userId === userId
        )
      ) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid verification link"
        );
      }

      const updateUserVerificationStatus = await datasource.updateAgent(
        agent.userId,
        { hasVerifiedEmail: true, emailVerificationToken: null }
      );
      if (!updateUserVerificationStatus) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could not verify email"
        );
      }

      if (!!source && source === "email") {
        return res
          .status(HttpStatusCode.OK)
          .send(
            VerificationPage(
              "Your Account Has Been Verified Successfully",
              HttpStatusCode.OK,
              `${process.env.BNJ_WEB_BASE_URL}/login`
            )
          );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "email verified successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async exportAllAgents(req, res, next) {
    try {
      if (!Access.CAN_EXPORT.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }
      const filters = HelperUtils.mapAsFilter(req.query);

      if (filters.status) {
        filters.status = filters.status.map(
          (value) => !!(value === "active" || value === "true")
        );
      }

      delete filters.limit;
      // HelperUtils.print({filters});
      const agents = await datasource.fetchAllAgents(filters);
      // HelperUtils.print({users});

      const downloadUrl = HelperUtils.arrayToCSV(
        agents.rows.map((eachAgent) => eachAgent.dataValues)
      );
      // return res.end(`<a href='${downloadUrl}' download='users.csv'>users.csv</a>`);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: `Found ${agents ? agents.rows.length : 0} results`,
        data:
          agents.rows.length === 0
            ? null
            : {
              name: "agents.csv",
              url: downloadUrl,
            },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async enableOrDisableAgent(req, res, next) {
    try {
      const { status, userId } = req.body;

      if (!Access.CAN_ACTIVATE_DEACTIVATE_USERS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      const agent = await datasource.fetchOneAgent(userId);
      if (!agent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "agent not found"
        );
      }

      const payload = { status };
      const profileUpdateResult = await datasource.updateAgent(
        agent.userId,
        payload
      );
      if (!profileUpdateResult) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: `profile ${status ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async suspendDownline(req, res, next) {
    try {
      const { userId } = req.body;

      if (!Access.ALL_AGENTS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      const currentAgent = await datasource.fetchOneAgent(req.user.userId);
      if (!currentAgent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current agent details not found"
        );
      }

      if (currentAgent.status === false) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Action denied. Your account is currently suspended"
        );
      }

      const targetAgent = await datasource.fetchOneAgent(userId);
      if (!targetAgent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "Downline agent not found"
        );
      }

      const targetAgentIsNotADownline = !currentAgent.downlines.find(
        (eachDownline) => eachDownline.userId === targetAgent.userId
      );

      if (targetAgentIsNotADownline) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Specified agent is not a downline of current agent"
        );
      }

      if (targetAgent.status === false) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Account has already been suspended"
        );
      }

      const payload = {
        status: false,
        suspensionType: SUSPENSION_TYPES.AGENT_SUSPENSION,
      };
      const profileUpdateResult = await datasource.updateAgent(
        targetAgent.userId,
        payload
      );
      if (!profileUpdateResult || profileUpdateResult[1] < 1) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could not suspend agent"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Downline suspended successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async reactivateDownline(req, res, next) {
    try {
      const { userId } = req.body;

      if (!Access.ALL_AGENTS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      const currentAgent = await datasource.fetchOneAgent(req.user.userId);
      if (!currentAgent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current agent details not found"
        );
      }

      // if (currentAgent.status === false) {
      //   return sendErrorResponse(
      //     res,
      //     HttpStatusCode.FORBIDDEN,
      //     'Action denied. Your account is currently suspended'
      //   );
      // }

      const targetAgent = await datasource.fetchOneAgent(userId);
      if (!targetAgent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "Downline agent not found"
        );
      }

      const targetAgentIsNotADownline = !currentAgent.downlines.find(
        (eachDownline) => eachDownline.userId === targetAgent.userId
      );

      if (targetAgentIsNotADownline) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Specified agent is not a downline of current agent"
        );
      }

      if (targetAgent.status === true) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Account has already been activated"
        );
      }

      if (Number(targetAgent.walletBalance) < 0) {
        const repaymentAmount = Math.abs(Number(targetAgent.walletBalance));

        if (Number(currentAgent.walletBalance) < repaymentAmount) {
          return sendErrorResponse(res, 422, "Insufficient balance");
        }

        const transaction = new Transaction(
          currentAgent,
          TRANSACTION_TYPES.CHARGE,
          repaymentAmount,
          "Downline account reactivation",
          HelperUtils.generateReferenceId(),
          "source",
          true,
          WALLET_TYPES.MAIN
        );
        const transferResponse = await PaymentHandler.walletTransfer(
          datasource,
          transaction,
          {
            from: currentAgent,
            to: targetAgent,
            recipientNarration: `Account reactivated with ${Number(
              repaymentAmount
            ).toFixed(2)} from ${currentAgent.firstname} ${
              currentAgent.lastname
            }.`,
            destAccount: WALLET_TYPES.MAIN,
          }
        );

        if (!transferResponse || transferResponse.status !== "success") {
          return sendErrorResponse(
            res,
            HttpStatusCode.BAD_REQUEST,
            "Could not perform transaction. Try again later"
          );
        }
      }

      const payload = { status: true, suspensionType: null };
      const profileUpdateResult = await datasource.updateAgent(
        targetAgent.userId,
        payload
      );
      if (!profileUpdateResult || profileUpdateResult[1] < 1) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could not reactivate agent account"
        );
      }
      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Downline reactivated successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAgentAnalytics(req, res, next) {
    try {
      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // HelperUtils.print({filters});
      const analytics = await datasource.fetchAgentAnalytics();

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Fetched analytics successfully",
        data: analytics,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAgentSalesReport(req, res, next) {
    try {
      const { interval } = req.query;

      if (!Access.ALL_AGENTS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval. Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const { userId } = req.user;

      const agentUser = await datasource.fetchOneAgent(userId);
      HelperUtils.print(agentUser.userId);

      const report = await datasource.fetchAgentSalesReport(
        userId,
        interval,
        20
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async createAdminUser(req, res, next) {
    try {
      const {
        firstname, lastname, email, password, role
      } = req.body;

      const existingAdmin = await datasource.fetchOneAdmin(email);
      if (existingAdmin) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "admin with email exist already"
        );
      }

      if (!Access.ALL_ADMINS.includes(role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid role for admin"
        );
      }

      const admin = new Admin(firstname, lastname, email, password, role);

      const accountCreationResponse = await datasource.createAdmin(admin);
      // HelperUtils.print(accountCreationResponse, user);
      const emailVerificationLink = `${process.env.BASE_URL}/api/v1/admin/verify-email?adminId=${accountCreationResponse.adminId}&verificationCode=${admin.emailVerificationToken}&source=email`;

      await sendEmail({
        origin: req.origin || req.originalUrl || req.ip,
        senderEmail: "admin@lotto.com",
        receipientEmail: email,
        subject: "Account Verification",
        content: UserVerificationMailContent(
          HelperUtils.capitalizeFirstLetters(firstname),
          HelperUtils.capitalizeFirstLetters(lastname),
          emailVerificationLink
        ),
      });

      return sendSuccessResponse(res, HttpStatusCode.CREATED, {
        message: "Created Successfully",
        // emailVerificationLink,
        data: {
          adminId: accountCreationResponse.adminId,
          name: admin.name,
          email: admin.email,
          status: admin.status,
          role: admin.role,
          hasVerifiedEmail: admin.hasVerifiedEmail,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async loginAdmin(req, res, next) {
    try {
      const { email, password } = req.body;

      const admin = await datasource.fetchUserCredentials(email, "admin");
      if (!admin) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "admin not found"
        );
      }

      // If admin account is suspended
      if (admin.status === false) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Account has been suspended. Contact support for more information"
        );
      }

      if (!ph.compareHashAndString(admin.password, password)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.UNAUTHORIZED,
          "incorrect login"
        );
      }

      const payload = {
        adminId: admin.adminId,
        email: admin.email,
        phone: admin.phone,
        name: admin.name,
        status: admin.status,
        role: admin.role,
        hasVerifiedEmail: admin.hasVerifiedEmail,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin,
      };

      await datasource.updateAdmin(admin.adminId, {
        lastLogin: customDate().toISOString(),
      });

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Logged in successfully",
        data: {
          adminId: payload.adminId,
          token: createToken(payload),
          expiresAt: new Date(Date.now() + 3600000 * 24).toUTCString(),
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAdmin(req, res, next) {
    try {
      const { adminId } = req.params;

      const admin = await datasource.fetchOneAdmin(adminId);
      // HelperUtils.print(VALID_APP_ROLES);
      if (!admin) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "admin not found"
        );
      }

      const payload = {
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        hasVerifiedEmail: admin.hasVerifiedEmail,
        status: admin.status,
        lastLogin: admin.lastLogin,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      };

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "admin found successfully",
        data: payload,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAllAdmins(req, res, next) {
    try {
      const filters = HelperUtils.mapAsFilter(req.query);

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "You don't have permission to access this endpoint"
        );
      }

      if (filters.status) {
        if (typeof filters.status === "string") {
          filters.status = filters.status.split(",");
        }

        filters.status = filters.status.map(
          (value) => !!(value === "active" || value === "true")
        );
      }

      const adminlist = await datasource.fetchAllAdmins(filters);
      const { count, rows } = adminlist;
      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: `Found ${rows ? rows.length : 0} results`,
        totalCount: count,
        data: rows,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async sendAdminVerificationMail(req, res, next) {
    try {
      const { adminId } = req.body;

      const existingAdmin = await datasource.fetchOneAdmin(adminId);
      // HelperUtils.print(user);
      if (!existingAdmin) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "admin not found"
        );
      }

      if (existingAdmin.hasVerifiedEmail) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Email has already been verified"
        );
      }

      const verificationCode = HelperUtils.generateRandomCharacters(32);
      const updateTokenResponse = await datasource.updateAdmin(
        existingAdmin.adminId,
        {
          emailVerificationToken: verificationCode,
        }
      );

      if (!updateTokenResponse) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured! Please try again."
        );
      }

      // eslint-disable-next-line no-unused-vars
      const [updateObject, updateCount] = updateTokenResponse;

      if (updateCount && updateCount === 0) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured! Please try again."
        );
      }
      const emailVerificationLink = `${process.env.BASE_URL}/api/v1/admin/verify-email?adminId=${existingAdmin.adminId}&verificationCode=${verificationCode}&source=email`;

      await sendEmail({
        origin: req.origin || req.originalUrl || req.ip,
        senderEmail: "admin@lotto.com",
        receipientEmail: existingAdmin.email,
        subject: "Account Verification",
        content: UserVerificationMailContent(
          HelperUtils.capitalizeFirstLetters(existingAdmin.firstname),
          HelperUtils.capitalizeFirstLetters(existingAdmin.lastname),
          emailVerificationLink
        ),
      });

      return sendSuccessResponse(res, HttpStatusCode.CREATED, {
        message: "Email verification link has been sent to your primary email",
        emailVerificationLink,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async verifyAdminEmail(req, res, next) {
    try {
      const { adminId, verificationCode, source } = req.query;

      const admin = await datasource.fetchOneAdmin(adminId);
      // HelperUtils.print(adminId, admin, verificationCode);
      if (!adminId || !admin || !verificationCode) {
        if (!!source && source === "email") {
          return res
            .status(HttpStatusCode.OK)
            .send(
              VerificationPage(
                "Invalid Verification Link",
                HttpStatusCode.BAD_REQUEST,
                "#"
              )
            );
        }

        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid verification link"
        );
      }

      if (admin.hasVerifiedEmail) {
        if (!!source && source === "email") {
          return res
            .status(HttpStatusCode.OK)
            .send(
              VerificationPage(
                "Email Has Been Verified!",
                HttpStatusCode.BAD_REQUEST,
                `${process.env.BNJ_ADMIN_BASE_URL}/login`
              )
            );
        }

        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "Email has been verified already"
        );
      }

      if (
        !(
          admin.emailVerificationToken === verificationCode
          && admin.adminId === adminId
        )
      ) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "invalid verification link"
        );
      }

      const updateUserVerificationStatus = await datasource.updateAdmin(
        adminId,
        { hasVerifiedEmail: true, emailVerificationToken: null }
      );
      if (!updateUserVerificationStatus) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Could not verify email"
        );
      }

      if (!!source && source === "email") {
        return res
          .status(HttpStatusCode.OK)
          .send(
            VerificationPage(
              "Your Account Has Been Verified Successfully",
              HttpStatusCode.OK,
              `${process.env.BNJ_ADMIN_BASE_URL}/login`
            )
          );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "email verified successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async updateAdmin(req, res, next) {
    try {
      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "You don't have permission to access this endpoint"
        );
      }

      const { firstname, lastname, role } = req.body;
      const { adminId } = req.params;

      const admin = await datasource.fetchOneAdmin(adminId);
      if (!admin) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "admin not found"
        );
      }
      // HelperUtils.print(admin);

      const [currentFirstname, currentLastname] = admin.name.split(" ");
      // HelperUtils.print(currentFirstname, currentLastname);

      const payload = {
        name: `${firstname || currentFirstname} ${lastname || currentLastname}`,
        role,
      };
      // HelperUtils.print(payload);

      const profileUpdateResult = await datasource.updateAdmin(
        admin.adminId,
        payload
      );
      if (!profileUpdateResult) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "admin profile updated successfully",
        data: {
          ...payload,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async enableOrDisableAdmin(req, res, next) {
    try {
      const { status, adminId } = req.body;

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Access denied. Only admins allowed"
        );
      }

      const admin = await datasource.fetchOneAdmin(adminId);
      if (!admin) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "admin account not found"
        );
      }

      const payload = { status };
      const profileUpdateResult = await datasource.updateAdmin(
        admin.adminId,
        payload
      );
      if (!profileUpdateResult) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: `profile ${status ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async exportAllAdmins(req, res, next) {
    try {
      if (!Access.CAN_EXPORT.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }
      const filters = HelperUtils.mapAsFilter(req.query);

      if (filters.status) {
        filters.status = filters.status.map(
          (value) => !!(value === "active" || value === "true")
        );
      }

      delete filters.limit;
      // HelperUtils.print({filters});
      const admins = await datasource.fetchAllAdmins(filters);
      // HelperUtils.print({users});

      const downloadUrl = HelperUtils.arrayToCSV(
        admins.rows.map((eachAdmin) => eachAdmin.dataValues)
      );
      // return res.end(`<a href='${downloadUrl}' download='users.csv'>users.csv</a>`);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: `Found ${admins.rows ? admins.rows.length : 0} results`,
        data:
          admins.rows.length === 0
            ? null
            : {
              name: "admins.csv",
              url: downloadUrl,
            },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAdminAnalytics(req, res, next) {
    try {
      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // HelperUtils.print({filters});
      const analytics = await datasource.fetchAdminAnalytics();

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Fetched analytics successfully",
        data: analytics,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAdminActivity(req, res, next) {
    try {
      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      const filters = HelperUtils.mapAsFilter(req.query);
      // HelperUtils.print({filters});
      const activities = await datasource.fetchActivityLogs(filters);
      const { rows, count } = activities;
      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Fetched activities successfully",
        totalCount: count,
        data: rows,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchAdminSalesReport(req, res, next) {
    try {
      const { interval } = req.query;

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const { adminId } = req.user;

      HelperUtils.print(adminId);
      const adminUser = await datasource.fetchOneAdmin(adminId);
      HelperUtils.print(adminUser);

      const report = await datasource.fetchAdminSalesReport(interval, 20);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  async upgradeToInfluencer(req, res, next) {
    try {
      const { userId, bonusId } = req.body;
      // console.log(userId);
      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      const user = await datasource.fetchOneUser(userId, true);
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          `User not found`
        );
      }

      if (!user.referralCode) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Referred player cannot be promoted to influencer"
        );
      }

      if (!user.status) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Player is deactivated"
        );
      }

      let bonusToAssign = null;
      const updatePayload = {
        role: APP_ROLES.INFLUENCER.name,
      };
      if (bonusId) {
        bonusToAssign = await datasource.fetchSingleBonus(bonusId);
        if (!bonusToAssign) {
          return sendErrorResponse(
            res,
            HttpStatusCode.NOT_FOUND,
            `Bonus not found`
          );
        }

        updatePayload.assignedBonusId = bonusToAssign.bonusId;
      }

      // console.log(userId, role);
      const updateResponse = await datasource.updateUser(userId, updatePayload);

      if (!updateResponse || !updateResponse[1]) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          `An error occurred`
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Promoted successfully",
        data: {
          userId,
          firstname: user.firstname,
          lastname: user.lastname,
          role: updatePayload.role,
          AssignedBonus: bonusToAssign,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchSpecificPlayerReport(req, res, next) {
    try {
      const { interval, specificDate } = req.query;

      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const report = await datasource.fetchSpecificPlayerReport(
        interval,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
 *
 * @method
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns Response
 */
  async fetchSpecificSinglePlayerReport(req, res, next) {
    try {
      const { interval, userId, specificDate } = req.query;

      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const currentPlayer = await datasource.fetchOneUser(userId, false);
      if (!currentPlayer) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current player details not found"
        );
      }

      const report = await datasource.fetchSpecificSinglePlayerReport(
        interval,
        userId,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
 *
 * @method
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns Response
 */
  async fetchSpecificAgentReport(req, res, next) {
    try {
      const { interval, specificDate } = req.query;

      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const report = await datasource.fetchSpecificAgentReport(
        interval,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchSpecificSingleAgentReport(req, res, next) {
    try {
      const { interval, userId, specificDate } = req.query;

      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const currentAgent = await datasource.fetchOneAgent(userId);
      if (!currentAgent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current agent details not found"
        );
      }

      if (currentAgent.status === false) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Action denied. Your account is currently suspended"
        );
      }

      const report = await datasource.fetchSpecificSingleAgentReport(
        interval,
        userId,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchSpecificAgentReportRole(req, res, next) {
    try {
      const { interval, specificDate, referedBy } = req.query;

      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_AGENTS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const report = await datasource.fetchSpecificAgentReportRole(
        interval,
        specificDate,
        referedBy
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
 *
 * @method
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns Response
 */
  async fetchSpecificAgentReports(req, res, next) {
    try {
      const { interval, userId, specificDate } = req.query;
      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_AGENTS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const currentPlayer = await datasource.fetchOneUser(userId, false);
      if (!currentPlayer) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current player details not found"
        );
      }

      const report = await datasource.fetchSpecificSingleAgentReport(
        interval,
        userId,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchSpecificAgentCommissionReportRole(req, res, next) {
    try {
      const { interval, specificDate, referedBy } = req.query;

      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_AGENTS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const report = await datasource.fetchSpecificAgentCommissionReportRole(
        interval,
        specificDate,
        referedBy
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
  /**
 *
 * @method
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns Response
 */
  async fetchSpecificPlayerReports(req, res, next) {
    try {
      const { interval, userId, specificDate } = req.query;

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const currentPlayer = await datasource.fetchOneUser(userId, false);
      if (!currentPlayer) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current player details not found"
        );
      }

      const report = await datasource.fetchSpecificSinglePlayerReport(
        interval,
        userId,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
 *
 * @method
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns Response
 */
  async fetchSpecificAgentcommissionsReports(req, res, next) {
    try {
      const { interval, userId, specificDate } = req.query;
      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_AGENTS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const currentPlayer = await datasource.fetchOneUser(userId, false);
      if (!currentPlayer) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current player details not found"
        );
      }

      const report = await datasource.fetchSpecificCommissionSingleAgentReport(
        interval,
        userId,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
  /**
 *
 * @method
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns Response
 */
  async fetchSpecificPlayercommissionsReports(req, res, next) {
    try {
      const { interval, userId, specificDate } = req.query;

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const currentPlayer = await datasource.fetchOneUser(userId, false);
      if (!currentPlayer) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current player details not found"
        );
      }

      const report = await datasource.fetchSpecificCommissionSinglePlayerReport(
        interval,
        userId,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async fetchSpecificCommissionPlayerReport(req, res, next) {
    try {
      const { interval, specificDate } = req.query;

      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const report = await datasource.fetchSpecificCommissionPlayerReport(
        interval,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully. I tested the endpoint",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
 *
 * @method
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns Response
 */
  async fetchSpecificCommissionSinglePlayerReport(req, res, next) {
    try {
      const { interval, userId, specificDate } = req.query;

      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const currentPlayer = await datasource.fetchOneUser(userId, false);
      if (!currentPlayer) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current player details not found"
        );
      }

      const report = await datasource.fetchSpecificCommissionSinglePlayerReport(
        interval,
        userId,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
 *
 * @method
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns Response
 */
  async fetchSpecificCommissionAgentReport(req, res, next) {
    try {
      const { interval, specificDate } = req.query;

      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const report = await datasource.fetchSpecificCommissionAgentReport(
        interval,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
 *
 * @method
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns Response
 */
  async fetchSpecificCommissionSingleAgentReport(req, res, next) {
    try {
      const { interval, userId, specificDate } = req.query;

      // TODO: ADD CHECKS FOR CORRECT PARAMETER VALUES

      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          `${req.user.role} not allowed`
        );
      }

      // CHECK FOR interval QUERY PARAM
      if (!["daily", "weekly", "monthly"].includes(interval)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          `Invalid interval! Available intervals are: ${[
            "daily",
            "weekly",
            "monthly",
          ].join(", ")}`
        );
      }

      const currentAgent = await datasource.fetchOneAgent(userId);
      if (!currentAgent) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "current agent details not found"
        );
      }

      if (currentAgent.status === false) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Action denied. Your account is currently suspended"
        );
      }

      const report = await datasource.fetchSpecificCommissionSingleAgentReport(
        interval,
        userId,
        specificDate
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  },

};
