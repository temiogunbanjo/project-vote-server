const fs = require("fs");
// const AWS = require('aws-sdk');

module.exports = async (
  filePath,
) => {
  // create S3 instance with credentials
  const file = fs.readFileSync(filePath);
  return file;
};
