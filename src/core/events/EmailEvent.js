const { EventEmitter } = require("events");
const { SEND_EMAIL } = require("./eventTypes");
const { print, sendEmail } = require("./imports");

const emailEvent = new EventEmitter();

// Subscribe for FirstEvent
emailEvent.on(SEND_EMAIL, async (eventInfo) => {
  print(`Email: ${eventInfo}`);

  await sendEmail(eventInfo.data);
});

module.exports = emailEvent;
