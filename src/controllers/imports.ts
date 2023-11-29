const User = require("../schemas/UserSchema");

const ph = require("../utils/hash");
const TokenProcessor = require("../utils/tokenProcessor");
const SendResponses = require("../utils/sendResponses");
const Patterns = require("../templates/PatternTemplates");
const SendNotifications = require("../utils/sendNotifications");
const HelperUtils = require("../utils/HelperUtils");
const HttpStatusCode = require("../error-helpers/Statuscode");

const cloudUploader = require("../utils/upload");
const winston = require("../error-helpers/WistonLogger");
const Access = require("../core/roles/AccessHandler");
const PaymentHandler = require("../core/payment/PaymentHandler");

const db = require("../database/db");

const {
  createToken, verifyToken, createHashedToken, verifyHashedToken
} = TokenProcessor;
const { APP_ROLES, VALID_APP_ROLES } = Access;
const { sendSuccessResponse, sendErrorResponse } = SendResponses;
const { sendEmail } = SendNotifications;
const {
  customDate, customDate2, DEFAULT_FILTERS
} = HelperUtils;

const HtmlTemplates = require("../templates/HtmlTemplates");

const {
  staticUploadPath,
  TRANSACTION_TYPES,
  BONUS_STATUSES,
  BONUS_TYPES,
  SUSPENSION_TYPES,
  WALLET_TYPES,
  DRAW_METHODS,
  weekDayNames,
  MAX_SELECTION_ALLOWED,
  WINNING_REDEMPTION_METHODS
} = require("../globals");

const datasource = db;

module.exports = {
  APP_ROLES,
  VALID_APP_ROLES,
  TRANSACTION_TYPES,
  BONUS_STATUSES,
  BONUS_TYPES,
  SUSPENSION_TYPES,
  WALLET_TYPES,
  DRAW_METHODS,
  DEFAULT_FILTERS,
  WINNING_REDEMPTION_METHODS,
  MAX_SELECTION_ALLOWED,
  staticUploadPath,
  weekDayNames,
  Patterns,
  HttpStatusCode,
  HtmlTemplates,
  ph,
  HelperUtils,
  customDate,
  customDate2,
  createToken,
  createHashedToken,
  verifyToken,
  verifyHashedToken,
  sendErrorResponse,
  sendSuccessResponse,
  sendEmail,
  winston,
  AccessHandler: Access,
  PaymentHandler,
  cloudUploader,
  User,
  datasource,
};
export {};
