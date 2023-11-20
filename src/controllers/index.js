const generalControllers = require("./general");
const userControllers = require("./users");

module.exports = {
  ...generalControllers,
  ...userControllers,
};
