const appRoot = require('app-root-path');
const { createLogger, format, transports } = require('winston');

const {
  combine, timestamp, label, prettyPrint,
} = format;

const options = {
  file: {
    level: 'info',
    filename: `${appRoot}/logs/app.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

const logger = createLogger({
  format: combine(
    label({ label: 'Lottery' }),
    timestamp(),
    prettyPrint(),
  ),
  transports: [
    new transports.File(options.file),
    new transports.Console(options.console),
  ],
});

// get lets from morgan and output to a wiston file
logger.stream = {
  // eslint-disable-next-line no-unused-vars
  write(message, encoding) {
    logger.info(`${message}`);
  },
};

module.exports = logger;
