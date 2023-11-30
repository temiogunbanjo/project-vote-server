const generalControllers = require("./general");
const campaignController = require('./campaigns');


export default {
  ...generalControllers,
  ...campaignController
}
