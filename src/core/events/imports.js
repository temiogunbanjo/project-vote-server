const DataRepo = require("../../database/DataRepo");
const DataSource = require("../../database/DataSource");
const { printToFile: print } = require("../../utils/HelperUtils");
const { sendEmail } = require("../../utils/sendNotifications");

const dataRepo = new DataRepo();
const dataSource = new DataSource(dataRepo);
const datasource = dataSource;

module.exports = {
  datasource,
  print,
  sendEmail,
};
