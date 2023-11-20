const fs = require('fs');
const MobileDetect = require('mobile-detect');
const appRoot = require('app-root-path');
const uuidV4 = require('uuid').v4;
const HelperUtils = require('../utils/HelperUtils');

const start = new Date();

const writeToFile = async (activity) => {
  fs.appendFile(
    `${appRoot}/logs/deviceInfo.log`,
    `${JSON.stringify(activity)}\n`,
    (err) => {
      if (err) HelperUtils.print(err);
    }
  );
  return true;
};

const useAccessLog = async (req, res, next) => {
  try {
    const md = new MobileDetect(req.headers['user-agent']);
    let duration = new Date() - start;
    duration /= 1000;

    const body = {
      id: uuidV4(),
      agent: md.ua,
      deviceType: req.device.type,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      url: req.url,
      referral: req.headers.referer,
      method: req.method,
      status: res.statusCode,
      duration,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    await writeToFile(body);
    next();
  } catch (error) {
    next(error);
  }
};

const logAccess = async (req, res) => {
  const md = new MobileDetect(req.headers['user-agent']);
  let duration = new Date() - start;
  duration /= 1000;

  const body = {
    id: uuidV4(),
    agent: md.ua,
    deviceType: req.device.type,
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    url: req.url,
    referral: req.headers.referer,
    method: req.method,
    status: res.statusCode,
    duration,
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
  };

  return writeToFile(body);
};

module.exports = {
  logAccess,
  useAccessLog
};
