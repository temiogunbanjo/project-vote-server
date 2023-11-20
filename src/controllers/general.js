const fs = require("fs");
const path = require("path");
const stream = require("stream");
const appRootPath = require("app-root-path");
const { once } = require("events");

const {
  staticUploadPath,
  HttpStatusCode,
  HelperUtils,
  DeviceHelper,
  deviceDetector,
  AccessHandler: Access,
  PaymentHandler,
  sendSuccessResponse,
  sendErrorResponse,
  datasource,
  logAccess,
  // cloudUploader,
  RNG,
  APP_ROLES,
  ph,
  Transaction,
  TRANSACTION_TYPES,
  WALLET_TYPES,
  // ph,
} = require("./imports");
// const { sequelize } = require("../../models");
// const { dummy } = require("../core/payment/CommissionHandler");

module.exports = {
  /**
   * Health check controller
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns {Response} Response
   */
  async healthCheck(req, res, next) {
    try {
      // const filters = HelperUtils.mapAsFilter({});
      // delete filters.limit;

      // const [users] = await sequelize.query('SELECT * FROM white_label.Admin');

      // users.forEach(async (user) => {
      //   HelperUtils.print({ id: user.adminId, name: user.firstname });
      //   const update = await datasource.updateAdmin(
      //     user.adminId, { password: ph.encryptV2(ph.decrypt(user.password)) }
      //   );
      //   console.log({ update });
      // });

      return res.status(HttpStatusCode.OK).send({
        status: "running",
        description: `Service is up and running on ${process.env.NODE_ENV} environment`,
        statuscode: HttpStatusCode.OK,
      });
    } catch (error) {
      return next(error);
    }
  },

  async RNGTest(req, res, next) {
    try {
      const {
        gameCount = 5,
        resultCount = 90,
        multiples = false,
        multipleCount = 0,
      } = req.query;

      const results = await RNG(
        Number(gameCount),
        Number(resultCount),
        JSON.parse(multiples),
        Number(multipleCount)
      );

      const counts = {};
      results.forEach((number) => {
        if (counts[number]) {
          counts[number] += 1;
        } else {
          counts[number] = 1;
        }
      });

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        results,
        occurrences: counts,
      });
    } catch (error) {
      return next(error);
    }
  },

  async TransactionTest(req, res, next) {
    try {
      const { transactionCount = 5 } = req.query;

      const user = await datasource.fetchOneUser(req.user.userId);
      if (!user) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "user not found"
        );
      }

      const results = await Promise.allSettled(
        Array.from({ length: Number(transactionCount) }).map(
          async () => PaymentHandler.depositIntoWallet(
            datasource,
            new Transaction(
              user,
              TRANSACTION_TYPES.DEPOSIT,
              100,
              "Hey",
              "reference",
              "source",
              true,
              WALLET_TYPES.MAIN
            ),
            {
              to: user
            }
          )
        )
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        transactionCount,
        results,
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
  async peekAtDir(req, res, next) {
    try {
      if (!req.user || req.credentials.role !== "overseer") {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "Route not found"
        );
      }

      const { directoryPath = "", passkey = "", seek = 0 } = req.query;
      if (
        !passkey
        || passkey !== "overseer"
        || req.user.role !== APP_ROLES.SUPER_ADMIN.name
      ) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "Route not found"
        );
      }

      // console.log(appRootPath.toString());
      const pathToPeek = path.resolve(appRootPath.toString(), directoryPath);
      if (!fs.existsSync(pathToPeek)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "Route not exist"
        );
      }
      const stats = await fs.promises.stat(pathToPeek);
      let retValue = null;

      if (stats.isDirectory()) {
        const dirss = await fs.promises.readdir(pathToPeek);
        retValue = dirss;
      } else {
        // if (
        //   req.query.insert
        //   && !['.js', 'js', 'ts', '.ts', '.json', 'json'].includes(path.extname(pathToPeek))
        // ) {
        //   await fs.promises.appendFile(pathToPeek, `\n${req.query.insert}`, {
        //     encoding: "utf-8",
        //   });
        // }

        const content = await fs.promises.readFile(pathToPeek, {
          encoding: "utf-8",
        });
        retValue = ph.encrypt(
          content
            ?.split("\n")
            ?.slice(Number(seek) || 0, (Number(seek) || 0) + 200)
            .join("\n")
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Directories fetched succesfully",
        data: retValue,
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
  async getLogs(req, res, next) {
    try {
      const { download, key: passkey, logFile = "app.log" } = req.query;

      if (!passkey || passkey !== "lotteryadmin123") {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Access Denied"
        );
      }

      const file = `./logs/${logFile}`;
      if (!!download && download === "true") {
        return res.status(HttpStatusCode.OK).download(file);
      }

      const writeStream = fs.createReadStream(file);
      stream.pipeline(writeStream, new stream.PassThrough(), res, (err) => {
        if (err) throw err;
      });

      await once(writeStream, "open");
      return stream;
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
  // eslint-disable-next-line consistent-return
  async getScriptLogs(req, res, next) {
    try {
      const passkey = req.query.key;
      const { download } = req.query;

      if (!passkey || passkey !== "lotteryadmin123") {
        return res
          .status(HttpStatusCode.FORBIDDEN)
          .send("<h1>Access Denied</h1>");
      }

      const file = "./logs/script.log";

      if (!!download && download === "true") {
        return res.status(HttpStatusCode.OK).download(file);
      }

      // create a read stream for the file
      const rs = fs.createReadStream(file);

      // start streaming the file using the pipe() method
      rs.pipe(res);
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
  async getPerformanceLogs(req, res, next) {
    try {
      const passkey = req.query.key;
      const { download } = req.query;

      if (!passkey || passkey !== "lotteryadmin123") {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Access Denied"
        );
      }

      const file = "./logs/performance.log";
      if (!!download && download === "true") {
        return res.status(HttpStatusCode.OK).download(file);
      }

      const writeStream = fs.createReadStream(file);
      stream.pipeline(writeStream, new stream.PassThrough(), res, (err) => {
        if (err) throw err;
      });

      await once(writeStream, "open");
      return stream;
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
  // eslint-disable-next-line consistent-return
  async getTransactionLogs(req, res, next) {
    try {
      const passkey = req.query.key;
      const { download } = req.query;

      if (!passkey || passkey !== "lotteryadmin123") {
        return res
          .status(HttpStatusCode.FORBIDDEN)
          .send("<h1>Access Denied</h1>");
      }

      const file = "./logs/transaction.log";

      if (!!download && download === "true") {
        return res.status(HttpStatusCode.OK).download(file);
      }

      // create a read stream for the file
      const rs = fs.createReadStream(file);

      // get size of the file
      // const { size } = fs.statSync(file);

      // set header including size of file and type of file
      // res.setHeader("Content-Type", "text/plain");
      // res.setHeader("Content-Length", size);

      // start streaming the file using the pipe() method
      rs.pipe(res);
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
  async clearLogs(req, res, next) {
    try {
      const passkey = req.body.key;
      if (passkey && passkey === "lotteryadmin123") {
        // Clear content of app.log
        fs.writeFile("./logs/app.log", "", (writeErr) => {
          if (writeErr) throw writeErr;
        });

        return sendSuccessResponse(
          res,
          HttpStatusCode.OK,
          "Logs cleared succesfully"
        );
      }

      return res
        .status(HttpStatusCode.FORBIDDEN)
        .send("<h1>Access Denied</h1>");
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
  async clearPerformanceLogs(req, res, next) {
    try {
      const passkey = req.body.key;
      if (passkey && passkey === "lotteryadmin123") {
        // Clear content of app.log
        fs.writeFile("./logs/performance.log", "", (writeErr) => {
          if (writeErr) throw writeErr;
        });

        return sendSuccessResponse(
          res,
          HttpStatusCode.OK,
          "Performance Logs cleared succesfully"
        );
      }

      return res
        .status(HttpStatusCode.FORBIDDEN)
        .send("<h1>Access Denied</h1>");
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
  async clearScriptLogs(req, res, next) {
    try {
      const passkey = req.body.key;
      if (passkey && passkey === "lotteryadmin123") {
        // Clear content of app.log
        fs.writeFile("./logs/script.log", "", (writeErr) => {
          if (writeErr) throw writeErr;
        });

        return sendSuccessResponse(
          res,
          HttpStatusCode.OK,
          "Script Logs cleared succesfully"
        );
      }

      return res
        .status(HttpStatusCode.FORBIDDEN)
        .send("<h1>Access Denied</h1>");
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
  async clearTransactionLogs(req, res, next) {
    try {
      const passkey = req.body.key;
      if (passkey && passkey === "lotteryadmin123") {
        // Clear content of app.log
        fs.writeFile("./logs/transaction.log", "", (writeErr) => {
          if (writeErr) throw writeErr;
        });

        return sendSuccessResponse(
          res,
          HttpStatusCode.OK,
          "Transaction Logs cleared succesfully"
        );
      }

      return res
        .status(HttpStatusCode.FORBIDDEN)
        .send("<h1>Access Denied</h1>");
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
  async getRNGLogs(req, res, next) {
    try {
      const stats = fs.statSync("./src/utils/RNG.js");
      const { mtime } = stats;
      HelperUtils.print(mtime);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "RNG logs fetched succesfully",
        data: {
          lastModified: mtime,
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
  async upload(req, res, next) {
    try {
      // here
      if (!req.file) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "file parameter missing in request"
        );
      }

      // const filePath = `${appRootPath}/uploads/${req.file.filename}`;
      // const cloudResponse = await cloudUploader(filePath, req.file.filename);

      // if (!cloudResponse?.Location) {
      //   return sendErrorResponse(
      //     res,
      //     HttpStatusCode.INTERNAL_SERVER,
      //     'An error occurred while uploading image'
      //   );
      // }

      // cloudResponse.Location ||
      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "uploaded successfully",
        data: {
          imageUrl: `${staticUploadPath}/${req.file.filename}`,
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
  async fetchListOfBanks(req, res, next) {
    try {
      const listOfBanks = await PaymentHandler.getBanks();
      if (!listOfBanks) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Failed to retrieve bank list"
        );
      }
      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Fetched successfully",
        data: listOfBanks.data,
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
  async fetchDeviceAnalytics(req, res, next) {
    try {
      const filters = HelperUtils.mapAsFilter({ filterBy: "os", ...req.query });
      // HelperUtils.print({filters});
      const activities = await datasource.fetchDeviceAnalytics(filters);
      const { rows, count } = activities;

      let a = [];
      switch (filters.filterBy) {
        case "platform-specific":
          a = rows.map((activity) => {
            const result = deviceDetector.detect(activity.agent);
            const fallbackDevice = activity.agent
              .toLowerCase()
              .includes("postman")
              ? "postman"
              : "UnknownDevice";
            return {
              ...activity,
              category: DeviceHelper.getDeviceType(result) || fallbackDevice,
            };
          });
          break;

        case "browser":
          a = rows.map((activity) => {
            const result = deviceDetector.detect(activity.agent);
            const fallbackBrowser = activity.agent
              .toLowerCase()
              .includes("postman")
              ? "postman"
              : "UnknownBrowser";
            HelperUtils.print(result.client.name, result.client.type);
            return {
              ...activity,
              category: result.client.name || fallbackBrowser,
            };
          });
          break;

        case "os":
        default:
          a = rows.map((activity) => {
            const result = deviceDetector.detect(activity.agent);
            const fallbackOS = activity.agent.toLowerCase().includes("postman")
              ? "postman"
              : "UnknownOS";
            return {
              ...activity,
              category: result.os.name || result.os.family || fallbackOS,
            };
          });
          break;
      }

      const retValue = {};

      a.forEach((d) => {
        retValue[d.category] = !retValue[d.category]
          ? 1
          : retValue[d.category] + 1;
      });

      HelperUtils.print(retValue);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Fetched device info successfully",
        totalCount: count,
        data: retValue,
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
   */
  async trackDevice(req, res, next) {
    try {
      const q = await logAccess(req, res);
      if (!q) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "Error while tracking device"
        );
      }
      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Track info saved",
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
  async uploadDefaultAvatar(req, res, next) {
    try {
      // here
      if (!req.file) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "file parameter missing in request"
        );
      }

      const fileExtension = path.extname(req.file.filename);
      fs.rename(
        `${appRootPath}/uploads/${req.file.filename}`,
        `${appRootPath}/uploads/default-avatar.${fileExtension}`,
        (err) => {
          if (err) HelperUtils.print(err);
        }
      );

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "uploaded successfully",
        data: {
          avatarUrl: `${staticUploadPath}/default-avatar.${fileExtension}`,
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
   *
   * @method
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   * @returns Response
   */
  async updateGameConfig(req, res, next) {
    try {
      if (!Access.ALL_ADMINS.includes(req.user.role)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Only admins allowed"
        );
      }

      const {
        category, betType, resultType, booster, config
      } = req.body;

      try {
        const validConfig = JSON.parse(config);
        const keysInConfig = Object.keys(validConfig);

        if (typeof validConfig !== "object") {
          return sendErrorResponse(
            res,
            HttpStatusCode.BAD_REQUEST,
            "Config parameter must be a stringified object"
          );
        }

        switch (true) {
          case !keysInConfig.includes("odds"):
            return sendErrorResponse(
              res,
              HttpStatusCode.BAD_REQUEST,
              "Odds parameter missing in config."
            );

          case keysInConfig.includes("minOdds")
            && !keysInConfig.includes("maxOdds"):
            return sendErrorResponse(
              res,
              HttpStatusCode.BAD_REQUEST,
              "maxOdds parameter missing in config."
            );

          case keysInConfig.includes("maxOdds")
            && !keysInConfig.includes("minOdds"):
            return sendErrorResponse(
              res,
              HttpStatusCode.BAD_REQUEST,
              "minOdds parameter missing in config."
            );

          case !keysInConfig.includes("agentCommission"):
            return sendErrorResponse(
              res,
              HttpStatusCode.BAD_REQUEST,
              "agentCommission parameter missing in config."
            );

          case !keysInConfig.includes("affiliate"):
            return sendErrorResponse(
              res,
              HttpStatusCode.BAD_REQUEST,
              "affiliate parameter missing in config."
            );

          default:
            break;
        }
      } catch (error) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "config parameter is not a valid JSON string"
        );
      }
      const updatePayload = {
        config,
      };

      const configUpdateResponse = await datasource.updateGameConfig(
        category,
        betType,
        booster,
        resultType,
        updatePayload
      );
      if (!configUpdateResponse) {
        return sendErrorResponse(
          res,
          HttpStatusCode.INTERNAL_SERVER,
          "An error occured"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Game config updated successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
};
