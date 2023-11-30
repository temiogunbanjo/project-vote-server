/* eslint-disable no-underscore-dangle */
const fs = require("fs");
const appRoot = require("app-root-path");
const { EventEmitter } = require("events");

const HelperUtils = require("./HelperUtils");

const LoggerEvent = new EventEmitter();

// Subscribe for FirstEvent
LoggerEvent.on("write-to-file", async (eventInfo) => {
  // HelperUtils.print(eventInfo);
  const { activity, options } = eventInfo;
  try {
    // this.print(appRoot);
    const filePath = `${appRoot}/logs/${options.path}`;
    fs.stat(filePath, (err, stats) => {
      if (err) {
        HelperUtils.print(`File doesn't exist.`);
        fs.writeFile(filePath, "", (writeErr) => {
          if (writeErr) HelperUtils.print(writeErr);
        });
      } else {
        // If file size is greater that 5MB, clear the file
        if (stats.size > options.MAX_FILE_SIZE) {
          fs.writeFile(filePath, "", (writeErr) => {
            if (writeErr) HelperUtils.print(writeErr);
          });
        }
        // ...and log the activity
        fs.appendFile(filePath, `${JSON.stringify(activity)},\n`, (err) => {
          HelperUtils.print(err);
        });
      }
    });
  } catch (/** @type {any} */error) {
    HelperUtils.print(`Logger > ${"write-to-file"}: ${error.message}`, {
      logging: true,
    });
  }
});

/**
 * @class
 */
const GeneralLogger = {
  print: HelperUtils.print,
  options: { MAX_FILE_SIZE: 8 * 1024 * 1024, path: "wallet.log" },
  /**
   * @param {Object} activity
   * @param {string} location
   */
  async writeToFile(activity, location) {
    LoggerEvent.emit("write-to-file", {
      activity,
      options: { ...this.options, path: location || this.options.path },
    });
  },

  /**
   * @param {*} userId
   * @param {*} response
   * @returns Object
   */
  _createPayload(userId, response) {
    const payload = {
      date: HelperUtils.customDate().toString(),
      userId,
      message: response || "",
    };

    // HelperUtils.print(payload);
    return payload;
  },
};

/**
 *
 * @param {string} path
 * @param {string} userId
 * @param {any} response
 */
module.exports = async (path, userId, response) => {
  try {
    const logger = GeneralLogger;
    logger.writeToFile(logger._createPayload(userId, response), path);
  } catch (err) {
    HelperUtils.print(err, { type: "error" });
  }
};
