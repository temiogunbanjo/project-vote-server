const generalControllers = require("./general");
const campaignControllers = require('./campaigns');
const schoolControllers = require('./schools');


export default {
  ...generalControllers,
  ...campaignControllers,
  ...schoolControllers
}
