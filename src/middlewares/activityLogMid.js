/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
const fs = require('fs');
const appRoot = require('app-root-path');

const HelperUtils = require('../utils/HelperUtils');

/**
 * @class
 */
class ActivityLogger {
  /**
   * @constructor
   * @param {Request} request
   */
  constructor(request) {
    this.print = HelperUtils.print;
    this.request = request;
  }

  /**
   * @param {Object} activity
   */
  static async writeToFile(activity) {
    fs.appendFile(
      `${appRoot}/logs/adminActivity.log`,
      `${JSON.stringify(activity)}\n`,
      (err) => {
        if (err) ActivityLogger.print(err);
      }
    );
  }

  /**
   * @param {*} actionName
   * @returns string
   */
  _convertUrlSegmentToString(actionName) {
    const o = (action) => actionName
      .split('-')
      .map((el, index) => {
        switch (index) {
          case 0:
            return action;

          default:
            return el.replace('-', ' ').trim();
        }
      })
      .join(' ');

    switch (true) {
      case actionName.match(/create-.*/gi) !== null:
        return o('created');

      case actionName.match(/fetch-.*/gi) !== null:
        return o('fetched');

      case actionName.match(/update-.*/gi) !== null:
        return o('updated');

      case actionName.match(/delete-.*/gi) !== null:
        return o('deleted');

      default:
        return '';
    }
  }

  /**
   *
   * @param {*} request
   * @returns Object
   */
  _getUserActionParameters(request = this.request) {
    // console.log(request.route);
    const splittedUrlFormat = request.route.path
      .split('/')
      .filter((eachPath) => eachPath.length >= 1);

    const splittedUrl = request.url
      .split('?')[0]
      .split('/')
      .filter((eachPath) => eachPath.length >= 1);

    let actionCategory = '';
    let actionName = '';
    let pathParameter = [];

    let lastUrlSubstringIndex = 0;

    for (let index = 0; index < splittedUrlFormat.length; index += 1) {
      const urlSubsection = splittedUrlFormat[index];

      if (urlSubsection.match(/:\w+/gi) !== null) {
        pathParameter.push(splittedUrl[index]);
      } else if (index + 1 === splittedUrlFormat.length) {
        actionName = splittedUrlFormat.length <= 2
          ? urlSubsection
          : `${splittedUrlFormat[lastUrlSubstringIndex]} ${urlSubsection}`;
      } else {
        lastUrlSubstringIndex = index;
        actionCategory += actionCategory === '' ? urlSubsection : `/${urlSubsection}`;
      }
    }

    pathParameter = pathParameter.join(', ');
    const actionString = this._convertUrlSegmentToString(actionName);

    const retValue = {
      actionCategory,
      actionName,
      pathParameter,
      actionString,
    };

    // console.log(retValue);
    return retValue;
  }

  /**
   *
   * @param {*} request
   * @returns Object
   */
  createPayload(request = this.request) {
    const payload = {
      adminId: request.user.adminId,
      name: request.user.adminId
        ? request.user.name
        : `${request.user.firstname} ${request.user.lastname}`,
      action: this._getUserActionParameters(request),
      requestMethod: request.method,
      date: HelperUtils.customDate().toString(),
    };

    payload.name = HelperUtils.capitalizeFirstLetters(payload.name);

    const { actionString, pathParameter } = payload.action;

    const adminWhoPerformedAction = `${payload.name} (${
      payload.adminId || ''
    })`;

    const actorParameters = (() => {
      const bodyParamList = Object.keys(request.body).filter(
        (key) => key.match(/(.*Id)|(.*name)|slug|title/gi) !== null
      );

      switch (true) {
        case !!pathParameter:
          return `(${pathParameter})`;

        case bodyParamList.length > 0:
          return `using parameters (${bodyParamList
            .map((key) => `${key}=${request.body[key]}`)
            .join(', ')})`;

        default:
          return '';
      }
    })();

    const actionPerformedByAdmin = `${
      actionString !== ''
        ? `${actionString} ${actorParameters}`
        : `made a ${payload.requestMethod} request to ${
          payload.action.actionName
        } endpoint ${
          actorParameters ? `with parameter(s): (${actorParameters})` : ''
        }`
    }`
      .trim()
      .replace(/\s+/g, ' ');

    payload.actionString = `${adminWhoPerformedAction} ${actionPerformedByAdmin} on ${payload.date}`;

    payload.action = JSON.stringify(payload.action);
    return payload;
  }
}

module.exports = async (req, res, next) => {
  try {
    const logger = new ActivityLogger(req);
    const payload = logger.createPayload(req);
    if (payload.adminId) {
      ActivityLogger.writeToFile(payload);
    }
    next();
  } catch (err) {
    next(err);
  }
};
