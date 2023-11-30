/* eslint-disable no-console */
/* eslint-disable no-plusplus */
const moment = require("moment-timezone");
// eslint-disable-next-line import/no-extraneous-dependencies
const dayjs = require("dayjs");
// eslint-disable-next-line import/no-extraneous-dependencies
const utc = require("dayjs/plugin/utc");
// eslint-disable-next-line import/no-extraneous-dependencies
const timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  from: new Date(1920, 0, 1, 24).toISOString(),
  order: ["createdAt:DESC"], // Sort by latest
};

/**
 *
 * @param {*} n
 * @returns {number}
 */
const factorial = (n) => {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
};

/**
 * A helper method for sorting array of objects using QuickSort Algorithm
 * @param {*} array
 * @param {*} propName
 * @param {*} isReversed
 * @returns {Array<any>}
 */
const sortArrayOfObjects = (array, propName, isReversed = false) => {
  const X = array[0];
  const leftArray = [];
  const rightArray = [];

  for (let i = 0; i < array.length; i += 1) {
    if (i !== 0) {
      const condition = !isReversed
        ? array[i][propName] < X[propName]
        : array[i][propName] > X[propName];

      if (condition) leftArray.push(array[i]);
      else rightArray.push(array[i]);
    }
  }

  if (leftArray.length <= 1 && rightArray.length <= 1) {
    return X ? [...leftArray, X, ...rightArray] : [...leftArray, ...rightArray];
  }

  return [
    ...sortArrayOfObjects(leftArray, propName, isReversed),
    X,
    ...sortArrayOfObjects(rightArray, propName, isReversed),
  ];
};

/**
 *
 * @param {any[]} array
 * @param {number} subarraySize
 * @returns {any[][]}
 */
function subdivideArray(array, subarraySize) {
  const sub = array.flat().slice(0, subarraySize);
  const remArray = array.flat().slice(subarraySize);
  // console.log(sub, remArray);

  if (remArray.length === 0 || remArray.length <= subarraySize) {
    return [sub, remArray];
  }

  // return [sub, remArray];
  return [sub].concat(subdivideArray(remArray, subarraySize));
}

const HelperUtils = {
  DEFAULT_FILTERS,
  /**
   * A helper print function for printing to the console based on the NODE_ENV
   * @param {*} content
   * @param {{
   *  type?: "info" | "error" | "fatal" | "warn" | "debug" | "trace";
   *  logging?: boolean;
   *  colorize?: boolean;
   * } | undefined} options
   */
  print(content, options = { type: "info", logging: false, colorize: true }) {
    // console.log(content);
    const shouldPrint = !process.env.NODE_ENV
      || process.env.NODE_ENV === "development"
      || (!!options && options.logging === true);

    if (shouldPrint) {
      if (!!options && options.colorize) {
        switch (true) {
          case !!options && options.type === "fatal":
            console.warn(content);
            break;

          case (!!options && options.type === "error")
            || content instanceof Error:
            console.error(content);
            break;

          case !!options && options.type === "warn":
            console.warn(content);
            break;

          case !!options && options.type === "debug":
            console.debug(content);
            break;

          case !!options && options.type === "trace":
            console.trace(content);
            break;

          default:
            console.info(content);
            break;
        }
      } else {
        // eslint-disable-next-line no-console
        console.log(content);
      }
    }
  },

  /**
   * A helper print function for printing to the console based on the NODE_ENV
   * @param {*} content
   * @param {{
   *  type?: "info" | "error";
   *  logging?: boolean;
   *  colorize?: boolean;
   * } | undefined} options
   */
  printToFile(content, options = { type: "info" }) {
    const shouldPrint = !process.env.NODE_ENV
      || process.env.NODE_ENV === "development"
      || (!!options && options.logging === true);

    if (shouldPrint) {
      switch (true) {
        case (!!options && options.type === "error")
          || content instanceof Error:
          // eslint-disable-next-line no-console
          console.error(content);
          break;

        case !!options && options?.type === "info":
        default:
          // eslint-disable-next-line no-console
          console.info(content);
          break;
      }
    }
  },

  /**
   * Converts numbers to their double digit format e.g. 3 => 03, 30 => 30
   * @param {string | number} numberToConvert
   * @returns string
   */
  convertToDoubleDigits(numberToConvert) {
    numberToConvert = parseInt(`${numberToConvert}`, 10);
    if (numberToConvert < 10) {
      numberToConvert = `0${numberToConvert}`;
    }

    return `${numberToConvert}`;
  },

  /**
   *
   * @param {*} array
   * @param {*} callback
   */
  async asyncForEach(array, callback) {
    const response = [];
    for (let i = 0; i < array.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const r = await callback(array[i], i, array);
      response.push(r);
    }
    return response;
  },

  /**
   * A helper method for generating a booking code
   * @returns string
   */
  generateBookingCode() {
    const currentTimeMS = new Date().getTime();
    return `WHITE${currentTimeMS
      .toString()
      .slice(currentTimeMS.toString().length - 7)}`;
  },

  /**
   * A helper method for generating random characters with configuration options
   * @param {number} length The length of the generated string
   * @param {{
   * lowercase?: boolean,
   * uppercase?: boolean,
   * alphabetsOnly?: boolean,
   * digitsOnly?: boolean,
   * prefix?: string;
   * splitBy?: string;
   * splitInterval?: number
   * }} options Can be used to format the resulting string. options.lowercase
   * results in randomly generated lowercase string while options.uppercase results in randomly
   * generated uppercase string
   * @param {string} characters A string of characters to randomize from. Example: 'AaBbcC01234'
   * @returns string
   */
  generateRandomCharacters(length, options = {}, characters = "") {
    let randomChar = "";
    let CHARACTERS = characters
      || "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789";
    options.prefix = options.prefix || "";

    if (!!options && options.alphabetsOnly === true) {
      CHARACTERS = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
    }

    if (!!options && options.digitsOnly === true) {
      CHARACTERS = "0123456789";
    }

    if (!!options && options.lowercase === true) {
      CHARACTERS = CHARACTERS.toLowerCase();
    }

    if (!!options && options.uppercase === true) {
      CHARACTERS = CHARACTERS.toUpperCase();
    }

    randomChar = options.prefix;

    // eslint-disable-next-line no-plusplus
    while (length-- > 0) {
      const index = Math.floor(Math.random() * CHARACTERS.length);
      randomChar += CHARACTERS.charAt(index);

      if (!!options && options.splitBy) {
        const splitBy = options.splitBy || "-";
        const splitInterval = options.splitInterval || 4;

        const pat = new RegExp(`${splitBy}`, "g");

        const actualRandomChar = randomChar.replace(pat, "");
        if (
          (actualRandomChar.length - options.prefix.length) % splitInterval
          === 0
        ) {
          randomChar += `${splitBy}`;
        }
      }
    }

    return randomChar;
  },
  /**
   *
   * @param {string | Date} specifiedDate
   * @param {*} removeSeconds
   * @returns
   */
  isCurrentDateGreaterThanSpecifiedDate(specifiedDate, removeSeconds = true) {
    if (!specifiedDate) return false;

    let currDate = new Date();
    specifiedDate = new Date(specifiedDate);

    // Remove last restart date 'seconds'
    specifiedDate = new Date(
      specifiedDate.getFullYear(),
      specifiedDate.getMonth(),
      specifiedDate.getDate(),
      specifiedDate.getHours(),
      specifiedDate.getMinutes(),
      removeSeconds ? 0 : specifiedDate.getSeconds(),
      removeSeconds ? 0 : specifiedDate.getMilliseconds()
    );

    // Remove current date 'seconds'
    currDate = new Date(
      currDate.getFullYear(),
      currDate.getMonth(),
      currDate.getDate(),
      currDate.getHours(),
      currDate.getMinutes(),
      removeSeconds ? 0 : currDate.getSeconds(),
      removeSeconds ? 0 : currDate.getMilliseconds()
    );

    return currDate.getTime() >= specifiedDate.getTime();
  },

  /**
   * A helper method for managing date timezone
   * @returns Moment
   */
  customDate(date = null) {
    let momentDateObj = null;
    const track = {
      before: new Date().toString(),
      after: "",
    };

    if (date) {
      momentDateObj = moment(date).tz("Africa/Lagos");
    } else {
      momentDateObj = moment().tz("Africa/Lagos");
    }

    track.after = momentDateObj.toString();
    // this.print(track, { logging: true });
    return momentDateObj;
  },

  /**
   * A helper method for managing date timezone
   * @returns Moment
   */
  customDate2(date = null) {
    let momentDateObj = null;
    const track = {
      before: new Date().toString(),
      after: "",
    };

    if (date) {
      momentDateObj = moment(date);
    } else {
      momentDateObj = moment();
    }

    track.after = momentDateObj.toString();
    // this.print(track, { logging: true });
    return momentDateObj;
  },

  /**
   * A helper method for managing date timezone
   * @returns DayJS
   */
  customDateDayJs(date = null) {
    const customizeDate = !date
      ? dayjs().tz("Africa/Lagos")
      : dayjs(date).tz("Africa/Lagos");
    return customizeDate;
  },
  /**
   *
   * @param {Date | number | null} date
   * @returns {number}
   */
  getMillisecondsInUTC(date = null) {
    const currentTime = !!date && (typeof date === "number" || date instanceof Date)
      ? new Date(date).getTime()
      : Date.now();
    return currentTime + new Date().getTimezoneOffset() * 60 * 1000;
  },

  /**
   *
   * @param {*} text
   * @returns string
   */
  formatAsSlug(text) {
    return `${text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^0-9a-z-]/gi, "")
      .replace(/[\\/]/g, "_")}`;
  },

  /**
   *
   * @param {*} time g
   * @returns string
   */
  formatAsCronExpression(time) {
    // print({ time });
    const [hour, minutes] = time.split(":");
    // <minute> <hour> <day-of-month> <month> <day-of-week> <command>
    return `${parseInt(minutes, 10)} ${parseInt(hour, 10)} * * *`;
  },

  /**
   * @param {string} string
   * @returns string
   */
  capitalizeFirstLetters(string) {
    const output = string
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .map(
        (eachWord) => eachWord.substring(0, 1).toUpperCase()
          + eachWord.substring(1).toLowerCase()
      )
      .join(" ");
    // this.print({ string, output });
    return output;
  },

  /**
   *
   * @param {*} settingPayload
   * @param {*} keyOfSetting
   * @returns
   */
  findASettingWithKey(settingPayload, keyOfSetting) {
    let { content } = settingPayload;
    try {
      content = JSON.parse(content);
    } catch (error) {
      return null;
    }

    const retObject = content.find((/** @type {{ name: any; varName: any; }} */ eachProp) => (
      eachProp.name === keyOfSetting || eachProp.varName === keyOfSetting
    ));
    if (retObject && retObject.value) {
      return retObject.value;
    }

    return null;
  },

  /**
   * @param {*} user
   */
  checkDailyWalletThreshold(user) {
    const d = this.customDate2();
    /** @type {number | moment.Moment} */
    let lastLoggedIn = this.customDate2(user.lastLogin);

    const today = new Date(d.year(), d.month(), d.date(), 0, 0, 0).getTime();

    lastLoggedIn = new Date(
      lastLoggedIn.year(),
      lastLoggedIn.month(),
      lastLoggedIn.date(),
      lastLoggedIn.hour(),
      lastLoggedIn.minute(),
      lastLoggedIn.second()
    ).getTime();

    return lastLoggedIn < today
      ? Number(user.walletBalance) >= Number(user.dailyLimit)
      : true;
  },

  /**
   *
   * @param {*} array
   * @returns
   */
  arrayToCSV(array) {
    const objectToCSVRow = (/** @type {string[]} */ dataObject) => {
      /** @type {string[]} */
      const dataArray = [];
      Object.keys(dataObject).forEach((o) => {
        // @ts-ignore
        const innerValue = dataObject[o] === null ? "" : dataObject[o].toString();
        const result = `${innerValue.replace(/"/g, '""')}`;
        dataArray.push(result);
      });

      const fresult = `${dataArray.join(",")}\r\n`;
      return fresult;
    };

    if (!array.length) return "";

    let csvContent = "data:text/csv;charset=utf-8,";
    // headers
    csvContent += objectToCSVRow(Object.keys(array[0]));
    array.forEach((/** @type {any} */ item) => {
      csvContent += objectToCSVRow(item);
    });

    const encodedURI = encodeURI(csvContent);
    this.print(encodedURI);
    return encodedURI;
  },

  /**
   * @param {string} secretKey
   * @returns {string}
   */
  deflateDPSSecretKey(secretKey = "") {
    return secretKey?.replace(/-/g, "").toUpperCase();
  },

  /**
   * @param {string} secretKey
   * @returns {string}
   */
  inflateDPSSecretKey(secretKey = "") {
    secretKey = HelperUtils.deflateDPSSecretKey(secretKey);
    return `${secretKey.slice(0, 4)}-${secretKey.slice(4, 8)}-${secretKey.slice(
      8,
      12
    )}-${secretKey.slice(12)}`.toUpperCase();
  },
};

// @ts-ignore
HelperUtils.DEFAULT_FILTERS.endDate = HelperUtils.customDate2().toISOString();

module.exports = {
  ...HelperUtils,
  factorial,
  sortArrayOfObjects,
  subdivideArray,
  /**
 *
 * @param {Date | null} date
 */
  formatDateAsTime: (date = null) => {
    const currentDate = date ? new Date(date) : HelperUtils.customDate2();
    return `${HelperUtils.convertToDoubleDigits(
      // @ts-ignore
      currentDate.getHours()
    )}:${HelperUtils.convertToDoubleDigits(
      // @ts-ignore
      currentDate.getMinutes()
    // @ts-ignore
    )}:${HelperUtils.convertToDoubleDigits(currentDate.getSeconds())}`;
  },
  /**
   * A helper method for generating a transaction referenceId
   * @returns string
   */
  generateReferenceId: () => {
    const currentTimeMS = new Date().getTime();
    return `TREF-${currentTimeMS
      .toString()
      .slice(
        currentTimeMS.toString().length - 4
      )}${HelperUtils.generateRandomCharacters(6)}`;
  },
  /**
   * A helper method for generating a unique bundle id
   * @returns string
   */
  generateBundleId: () => {
    const currentTimeMS = Date.now().toString();
    return `BUNDLE-${HelperUtils.generateRandomCharacters(4, {
      uppercase: true,
      alphabetsOnly: true,
    })}${currentTimeMS.slice(7)}`;
  },
  /**
   * A helper method for generating random characters and symbols for password
   * @returns string
   */
  generateRandomPassword: () => {
    const length = Math.round(Math.random() * 4) + 8; // 8 to 12
    const CHARACTERS = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789!@#$%&|?=";

    return HelperUtils.generateRandomCharacters(length, {}, CHARACTERS);
  },
  /**
   * A helper method for generating Api keys
   * @returns string
   */
  generateApiKey: (prefix = "", options = {}) => {
    const length = 32;
    options = {
      prefix,
      splitBy: "-",
      splitInterval: 6,
      ...options,
    };

    return HelperUtils.generateRandomCharacters(length, options);
  },
  /**
   *
   * @param {*} n
   * @param {*} k
   * @returns Number
   */
  combination: (n, k) => factorial(n) / (factorial(n - k) * factorial(k)),
  /**
   * @param {{[x: string]: any}} query
   * @returns {import("../types").QueryFilter}
   */
  mapAsFilter: (query) => {
    const userFilters = query;
    // @ts-ignore
    HelperUtils.DEFAULT_FILTERS.endDate = HelperUtils.customDate2().toISOString();

    // Remove duplicate keys
    const newSet = new Set(Object.keys(userFilters));
    let date;
    let month;
    let year;

    Array.from(newSet).forEach((param) => {
      if (Array.isArray(userFilters[param])) {
        [userFilters[param]] = userFilters[param];
      }

      switch (true) {
        // If query parameter includes a comma or param is 'order', turn to array
        case param === "order" || userFilters[param]?.includes(","):
          userFilters[param] = userFilters[param]
            .split(",")
            .map((/** @type {string} */ eachValue) => eachValue.trim())
            .filter((/** @type {string} */ value) => value !== "");
          break;

        case param === "startDate"
          || param === "endDate"
          || param === "minCreateDate"
          || param === "maxCreateDate":
          [date, month, year] = userFilters[param].split("/");
          userFilters[param] = HelperUtils.customDate2(
            // @ts-ignore
            new Date(year, month - 1, date, 24)
          ).toISOString();
          break;

        // D
        case param === "startTime" || param === "endTime":
          userFilters[param] = userFilters[param].trim();
          break;

        // H
        case param !== "search" && !!userFilters[param]?.match(/^(\d+)$/g):
          userFilters[param] = parseInt(userFilters[param], 10);
          break;

        // H
        case userFilters[param]?.match(/false|true/gi) !== null:
          userFilters[param] = JSON.parse(
            `${userFilters[param]}`.toLowerCase().trim()
          );
          break;

        default:
          break;
      }
    });

    // Merge Default filters and user filters
    /**
     * @type {import("../types").QueryFilter}
     */
    const filters = { ...HelperUtils.DEFAULT_FILTERS, ...userFilters };
    // HelperUtils.printToFile(filters);
    return filters;
  },
  /**
   *
   * @param {*} timeString
   * @param {*} dateReference
   * @returns {string | Date}
   */
  timeStringToDate: (timeString, dateReference = new Date()) => {
    const d = HelperUtils.customDate(dateReference);
    if (timeString) {
      const [hour, minutes, second] = timeString.split(":");
      const date = new Date(
        d.year(),
        d.month(),
        d.date(),
        hour || 0,
        minutes || 0,
        second || 0
      );
      return date;
    }

    return new Date(
      d.year(),
      d.month(),
      d.date(),
      d.hour(),
      d.minute(),
      d.second()
    );
  },
  /**
   *
   * @param {*} timeString
   * @param {*} dateReference
   * @returns {string | Date}
   */
  timeStringToDate2: (timeString, dateReference = new Date()) => {
    const d = HelperUtils.customDate2(dateReference);
    if (timeString) {
      const [hour, minutes, second] = timeString.split(":");
      const date = new Date(
        d.year(),
        d.month(),
        d.date(),
        hour || 0,
        minutes || 0,
        second || 0
      );
      return date;
    }

    return new Date(
      d.year(),
      d.month(),
      d.date(),
      d.hour(),
      d.minute(),
      d.second()
    );
  }
};
