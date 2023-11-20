const { EventEmitter } = require("events");
const { WALLET_DEPOSIT, WALLET_CHARGE } = require("./eventTypes");
const { datasource, print } = require("./imports");

const paymentEvent = new EventEmitter();

// Subscribe for FirstEvent
paymentEvent.on(WALLET_DEPOSIT, async (eventInfo) => {
  print(`Payment: ${eventInfo}`);

  print(
    `Sending notification to user(${eventInfo?.user?.firstname || "--"} ${
      eventInfo?.user?.lastname || "--"
    })...`
  );

  await datasource.sendNotificationToUser(eventInfo?.user?.userId, {
    title: eventInfo?.title,
    content: eventInfo?.content,
  });
});

paymentEvent.on(WALLET_CHARGE, async (eventInfo) => {
  print(`Payment: ${eventInfo}`);

  print(
    `Sending notification to user(${eventInfo?.user?.firstname || "--"} ${
      eventInfo?.user?.lastname || "--"
    })...`
  );

  await datasource.sendNotificationToUser(eventInfo?.user?.userId, {
    title: eventInfo?.title,
    content: eventInfo?.content,
  });
});

module.exports = paymentEvent;
