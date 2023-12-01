/**
 *
 * Description. (This module handles input validation globaly in the app)
 *
 */
const { body, query, validationResult } = require('express-validator');
const PatternTemplates = require('../templates/PatternTemplates');
const Patterns = require('../templates/PatternTemplates');
const SendResponses = require('../utils/sendResponses');

const { sendErrorResponse } = SendResponses;
const sqlInjectionSanitizer = (/** @type {string} */ value) => (!value ? value : value.replace(/--/g, ''));
const sqlInjectionValidator = (/** @type {string | null} */ value) => (!value ? !!value : value.match(/--/g) === null);

/**
 * @class
 * @name ValidatorMiddleWare
 */
class ValidatorMiddleWare {
  static validateSignUp = [
    body('email', 'please enter a valid email')
      .trim()
      .normalizeEmail()
      .isEmail()
      .custom(sqlInjectionValidator)
      .withMessage("Unacceptable character '--' found"),
    body('password')
      .trim()
      .isLength({ min: 8 })
      .withMessage('passwords length must be between 8 to 24')
      .custom(sqlInjectionValidator)
      .withMessage("Unacceptable character '--' found"),
    body('confirmPassword')
      .trim()
      .custom(sqlInjectionValidator)
      .withMessage("Unacceptable character '--' found")
      .custom((value, { req }) => value === req.body.password)
      .withMessage('password fields do not match'),
  ];

  static validateLogin = [
    body('phone')
      .optional()
      .trim()
      .escape()
      .isNumeric()
      .isLength({ min: 8, max: 20 })
      .customSanitizer((value) => (value ? value.replace(/\+234/g, '0') : value)),
    body('email')
      .optional()
      .normalizeEmail()
      .isEmail()
      .withMessage('please enter a valid email')
      .custom(sqlInjectionValidator)
      .withMessage("Unacceptable character '--' found"),
  ];

  static validatePasswordUpdate = [
    body('newPassword')
      .trim()
      .isLength({ min: 8 })
      .withMessage('passwords length must be between 8 to 24')
      .custom(sqlInjectionValidator)
      .withMessage("Unacceptable character '--' found"),
    body('confirmPassword')
      .trim()
      .custom(sqlInjectionValidator)
      .withMessage("Unacceptable character '--' found")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('password fields do not match'),
  ];

  static validatePinUpdate = [
    body('newTransactionPin')
      .exists()
      .withMessage('newTransactionPin parameter required')
      .isLength({ min: 4, max: 4 })
      .withMessage('transaction pin requires 4 digits')
      .isNumeric()
      .isInt(),
    body('confirmTransactionPin')
      .exists()
      .withMessage('confirmTransactionPin parameter required')
      .custom((value, { req }) => value === req.body.newTransactionPin)
      .withMessage('transaction pins fields do not match'),
  ];

  static validateProfileUpdate = [
    body('phone')
      .optional()
      .trim()
      .escape()
      .isNumeric()
      .isLength({ min: 8, max: 20 })
      .customSanitizer((value) => (value ? value.replace(/\+234/g, '0') : value)),
    body('firstname')
      .optional()
      .trim()
      .escape()
      // @ts-ignore
      .isAlpha('en-US', { ignore: [/\s+|-|\d/g] })
      .isLength({ min: 3 })
      .toLowerCase(),
    body('lastname')
      .optional()
      .trim()
      .escape()
      // @ts-ignore
      .isAlpha('en-US', { ignore: [/\s+|-|\d/g] })
      .isLength({ min: 3 })
      .toLowerCase(),
    body('bankCode')
      .optional()
      .trim()
      .escape()
      .isNumeric()
      .isLength({ min: 3 }),
    body('accountNumber')
      .optional()
      .trim()
      .escape()
      .isNumeric()
      .isLength({ min: 10, max: 10 })
      .withMessage('accountNumber must be 10 digits'),
    body('dailyLimit').optional().trim().escape()
      .isNumeric()
      .toFloat(),
  ];

  static validateLotteryUpdate = [
    body('category').optional().trim().isLength({ min: 3 })
      .toLowerCase(),
    body('setA')
      .optional()
      .isBoolean()
      .withMessage('setA parameter must be of type boolean'),
    body('setB')
      .optional()
      .isBoolean()
      .withMessage('setB parameter must be of type boolean'),
  ];

  static validateComboQueryParams = [
    query('category')
      .exists()
      .withMessage('category query parameter required')
      .not()
      .isEmpty()
      .isLength({ min: 1, max: 36 }),
    query('betType')
      .exists()
      .withMessage('betType query parameter required')
      .not()
      .isEmpty(),
    query('booster')
      .exists()
      .withMessage('booster query parameter required')
      .not()
      .isEmpty(),
    query('resultType')
      .exists()
      .withMessage('resultType query parameter required')
      .not()
      .isEmpty(),
  ];

  static validateCreateTicket = [
    body('gameId')
      .if(body('bookingCode').not().exists())
      .exists()
      .withMessage('gameId parameter required')
      .not()
      .isEmpty()
      .custom((value) => {
        const containsAlphabetNumber = !!value && value.match(/(\w+\d+)+/g) !== null;
        return containsAlphabetNumber;
      })
      .customSanitizer((value) => (value ? value.replace(/[–]/g, '-') : value))
      .isLength({ min: 36, max: 36 }),
    body('totalStakedAmount')
      .exists()
      .withMessage('totalStakedAmount parameter required')
      .isNumeric()
      .withMessage('Invalid value for totalStakedAmount parameter')
      .toFloat()
      .custom((value) => value >= 1)
      .withMessage('Minimum totalStakedAmount is 1.00'),
    body('betSlips')
      .exists()
      .withMessage('betSlips parameter required')
      .isString(),
  ];

  static validateBonus = [
    body('depositRound')
      .optional()
      .isIn([
        '1st',
        '2nd',
        '3rd',
        '4th',
        '5th',
        '6th',
        '7th',
        '8th',
        '9th',
        '10th',
        'every deposit',
        'next deposit',
      ])
      .withMessage(
        `Valid values are: ${[
          '1st',
          '2nd',
          '3rd',
          '4th',
          '5th',
          '6th',
          '7th',
          '8th',
          '9th',
          '10th',
          'every deposit',
          'next deposit',
        ].join(', ')}`
      )
      .trim(),
    body('winCount').optional().isInt().toInt(),
    body('gameType').optional().trim(),
    body('betType').optional().trim(),
    body('expiration', 'expiration must be numeric and must be between 1 - 1825 (days)')
      .optional()
      .isNumeric()
      .isLength({ min: 1, max: 1825 })
      .toInt(),
    body('minimumDeposit').optional().isNumeric().toFloat(),
    body('unitCost').optional().isNumeric().toFloat(),
    body('quantity').optional().isInt().toInt(),
    body('gamePlayCount').optional().isInt().toInt(),
  ];

  static optionalGameValidation = [
    body('startTime')
      .optional(),
    body('mrf')
      .optional()
      .isAlphanumeric()
      .withMessage("mrf can only contain alphabets and numbers")
      .isLength({ min: 5, max: 5 })
      .withMessage("mrf must be 5 characters")
      .toUpperCase(),
    body('totalFundPool')
      .optional()
      .isNumeric()
      .withMessage('Expected numeric value')
      .toFloat(),
    body('alternateStartDate')
      .optional()
      .custom((value) => {
        const isISODateString = !!value
          && value.match(PatternTemplates.iso_string_date_pattern) !== null;
        return isISODateString;
      })
      .withMessage('alternateStartDate must be in ISO date format')
      .trim()
  ];

  static validateGame = [
    ...ValidatorMiddleWare.selectValidation(
      'name',
      'lotteryId',
      'description',
      'drawMethod',
      'dayOfTheWeek',
      'isRecurring'
    ),
    ...this.optionalGameValidation
  ];

  static validateInstantGame = [
    ...ValidatorMiddleWare.selectValidation(
      'name',
      'lotteryId',
      'description',
      'recurringInterval'
    ),
  ];

  /**
   * @param {string} aliasedName
   * @returns Any
   */
  static handleAliases(aliasedName) {
    // ALIASED_PARAM_VALIDATIONS contains validators for parameters with a
    // different name (alias) not in KNOWN_PARAMETERS
    const ALIASED_PARAM_VALIDATIONS = {
      uuid: body(aliasedName)
        .exists()
        .withMessage(`${aliasedName} parameter required`)
        .custom((value) => {
          const containsAlphabetNumber = !!value && value.match(/(\w+\d+)+/g) !== null;
          return containsAlphabetNumber;
        })
        .customSanitizer((value) => (!value ? value : value.replace(/[–]/g, '-')))
        .isLength({ min: 36, max: 36 }),
      name: body(aliasedName)
        .exists()
        .withMessage(`${aliasedName} parameter required`)
        .trim()
        .escape()
        // @ts-ignore
        .isAlpha('en-US', { ignore: [/\s+|-|\d/g] })
        .isLength({ min: 3 })
        .toLowerCase(),
      boolean: body(aliasedName)
        .exists()
        .withMessage(`${aliasedName} parameter required`)
        .isBoolean()
        .withMessage(`${aliasedName} must be a boolean`),
    };

    // Defines conditions for parameter to be an alias of name
    const isUuidAlias = aliasedName.toLowerCase() === 'userid'
      || aliasedName.toLowerCase() === 'gameid'
      || aliasedName.toLowerCase() === 'lotteryid'
      || aliasedName.toLowerCase() === 'adminid';

    // Defines conditions for parameter to be an alias of name
    const isNameAlias = aliasedName.toLowerCase() === 'firstname'
      || aliasedName.toLowerCase() === 'lastname';

    const isBooleanType = aliasedName === 'status';

    // Use name validation if parameter is an alias of name
    if (isUuidAlias === true) return ALIASED_PARAM_VALIDATIONS.uuid;
    // Use name validation if parameter is an alias of name
    if (isNameAlias === true) return ALIASED_PARAM_VALIDATIONS.name;
    // Use boolean validation if parameter is expected to be boolean
    if (isBooleanType === true) return ALIASED_PARAM_VALIDATIONS.boolean;

    // Else, just return validator to test existence of this aliased parameter in request
    return body(aliasedName)
      .exists()
      .withMessage(`${aliasedName} parameter required`);
  }

  /**
   * @param {Array<any>} params
   * @returns Any
   */
  static selectValidation(...params) {
    // params is an array of arguments which specify the parameters to validate in the request
    // VALIDATION_CHAIN is the final array of validators that would be passed to express validator
    /**
     * @type {any[]}
     */
    const VALIDATION_CHAIN = [];
    // KNOWN_PARAMETERS is an array of all defined parameters used in the app
    const KNOWN_PARAMETERS = [
      'userId',
      'name',
      'email',
      'slug',
      'password',
      'passcode',
      'phone',
      'amount',
      'type',
      'selections',
      'accountNumber',
      'multiplier',
      'transactionPin',
    ];

    // PARAMETER_VALIDATIONS contains all KNOWN_PARAMETERS and their required validations
    const PARAMETER_VALIDATIONS = {
      userId: body('userId')
        .exists()
        .withMessage('userId parameter required')
        .notEmpty()
        .custom((value) => {
          const containsAlphabetNumber = !!value && value.match(/(\w+\d+)+/g) !== null;
          return containsAlphabetNumber;
        })
        .customSanitizer((value) => (!value ? value : value.replace(/[–]/g, '-')))
        .isLength({ min: 36, max: 36 }),
      name: body('name')
        .exists()
        .withMessage('name parameter required')
        .trim()
        .escape()
        // @ts-ignore
        .isAlpha('en-US', { ignore: [/\s+|-|\d/g] })
        .withMessage('only alphabets allowed')
        .isLength({ min: 3 })
        .toLowerCase(),
      phone: body('phone')
        .exists()
        .withMessage('phone parameter required')
        .trim()
        .escape()
        .isNumeric()
        .isLength({ min: 8, max: 20 })
        .customSanitizer((value) => (value ? value.replace(/\+234/g, '0') : value)),
      password: body('password')
        .exists()
        .withMessage('password parameter required')
        .trim()
        .custom(sqlInjectionValidator)
        .withMessage("Unacceptable character '--' found"),
      passcode: body('passcode')
        .exists()
        .withMessage('passcode parameter required')
        .trim()
        .isNumeric()
        .isLength({ min: 6, max: 6 })
        .withMessage('passcode must be 6 digits long')
        .custom(sqlInjectionValidator)
        .withMessage("Unacceptable character '--' found"),
      email: body('email')
        .exists()
        .withMessage('email parameter required')
        .normalizeEmail({ gmail_remove_dots: false })
        .isEmail()
        .withMessage('please enter a valid email')
        .customSanitizer(sqlInjectionSanitizer),
      amount: body('amount')
        .isNumeric()
        .withMessage('Invalid value for amount parameter')
        .toFloat()
        .custom((value) => value >= 1)
        .withMessage('Minimum amount is 1.00'),
      type: body('type')
        .exists()
        .withMessage('type parameter required')
        .trim()
        .escape()
        .isIn(['deposit', 'withdrawal', 'charge'])
        .withMessage(
          "invalid transaction type. Must be 'deposit', 'withdrawal', or 'charge'"
        )
        .isLength({ min: 3 })
        .toLowerCase(),
      selections: body('selections')
        .exists()
        .withMessage('selections parameter required')
        .trim()
        .escape()
        .custom((value) => {
          const containsNumbersWithDashes = value.match(
            Patterns.selection_joined_with_dashes_pattern
          ) !== null;
          return containsNumbersWithDashes;
        })
        .withMessage(
          'selections must be a sequence of numbers separated with short dashes'
        ),
      accountNumber: body('accountNumber')
        .exists()
        .withMessage('accountNumber parameter required')
        .trim()
        .isNumeric()
        .withMessage('accountNumber parameter must be numeric')
        .isLength({ min: 10, max: 10 })
        .withMessage('accountNumber must be 10 digits long'),
      transactionPin: body('transactionPin')
        .exists()
        .withMessage('transactionPin parameter required')
        .isLength({ min: 4, max: 4 })
        .withMessage('transaction pin requires 4 digits')
        .isNumeric()
        .isInt(),
      multiplier: body('multiplier')
        .exists()
        .withMessage('multiplier parameter required')
        .isNumeric()
        .isFloat(),
      slug: body('slug')
        .exists()
        .withMessage('slug parameter required')
        .trim()
        .toLowerCase()
        .isLength({ min: 3 })
        .withMessage('slug must be more than 3 characters long')
        .isSlug(),
      winningRedemptionMethod: body('winningRedemptionMethod')
        .exists()
        .withMessage('winningRedemptionMethod parameter required')
        .trim()
        .toLowerCase()
        .isIn(['bank', 'dps', 'wallet'])
        .withMessage(
          'winningRedemptionMethod must be either bank, dps or wallet'
        )
    };

    params.forEach((eachParam) => {
      // Checks if the parameter = require(request is in KNOWN_PARAMETERS
      // eslint-disable-next-line max-len
      const isInKnownParameters = KNOWN_PARAMETERS.findIndex(
        (eachKnownParam) => eachKnownParam === eachParam
      ) > -1;
      /*
        if parameter from request is in KNOWN_PARAMETERS, add the corresponding
        validator to VALIDATION_CHAIN.
        Else if parameter from request is not in KNOWN_PARAMETERS, check if parameter
        is just another name for a known parameter (alias) and add returned validator
        to VALIDATION_CHAIN.
      */
      VALIDATION_CHAIN.push(
        isInKnownParameters
          // @ts-ignore
          ? PARAMETER_VALIDATIONS[eachParam]
          : this.handleAliases(eachParam)
      );
    });

    return VALIDATION_CHAIN;
  }

  /**
   *
   * @param {Request} req
   * @param {Response} res
   * @param {import('express').NextFunction} next
   * @returns Any
   */
  static validateRequest(req, res, next) {
    const errors = validationResult(req);
    const errorObject = errors.array()[0];
    // @ts-ignore
    return errors.isEmpty() ? next() : sendErrorResponse(res, 422, errorObject);
  }
}

module.exports = ValidatorMiddleWare;
