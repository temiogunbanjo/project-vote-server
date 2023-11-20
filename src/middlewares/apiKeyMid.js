/* eslint-disable no-console */
/* eslint-disable valid-jsdoc */
/**
 *
 * Description. (This module handles apikey validation globaly in the app)
 */

const { sendErrorResponse } = require('../utils/sendResponses');
const StatusCodes = require('../error-helpers/Statuscode');
const dbValidator = require('../database/dbValidator');
const { apiKeyPattern } = require('../templates/PatternTemplates');

module.exports = async (req, res, next) => {
  try {
    if (!req.headers['x-api-key']) {
      return sendErrorResponse(res, StatusCodes.UNAUTHORIZED, 'API key required');
    }

    const apiKey = req.headers['x-api-key'];
    if (!apiKey.match(apiKeyPattern)) {
      return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid API key');
    }

    const apiKeyData = await dbValidator.getApiKey(apiKey);
    if (!apiKeyData) {
      return sendErrorResponse(res, StatusCodes.NOT_FOUND, 'API key not found');
    }

    if (apiKeyData.banned) {
      return sendErrorResponse(res, StatusCodes.FORBIDDEN, 'API key banned');
    }

    req.credentials = apiKeyData;
    return next();
  } catch (error) {
    return next(error);
  }
};
