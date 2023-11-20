const { EventEmitter } = require("events");
const { WALLET_DEPOSIT, CREATE_TRANSACTION_CHARGES } = require("./eventTypes");
const { datasource, print, transactionLogger } = require("./imports");
const { SUSPENSION_TYPES } = require("../../globals");

const walletEvent = new EventEmitter();

// Subscribe for FirstEvent
walletEvent.on(WALLET_DEPOSIT, async (eventInfo) => {
  print(`Wallet: ${JSON.stringify(eventInfo)}`);

  // await datasource.sendNotificationToUser(eventInfo?.user?.userId, {
  //   title: eventInfo?.title,
  //   content: eventInfo?.content,
  // });

  const user = await datasource.fetchOneUser(eventInfo?.data?.user?.userId, false);

  // FOR SUSPENDED USERS DUE TO OVERDRAFT
  const userShouldBeReactivated = !!user
    && !user.status
    && user.suspensionType === SUSPENSION_TYPES.OVERDRAFT
    && user.walletBalance > 0;

  if (userShouldBeReactivated) {
    print(
      `Reactivating user (${user?.firstname || "--"} ${
        user?.lastname || "--"
      })...`
    );
    await datasource.updateUser(user.userId, {
      status: true,
      suspensionType: null,
    });
  }
});

walletEvent.on(CREATE_TRANSACTION_CHARGES, async (eventInfo) => {
  print(`Wallet: ${JSON.stringify(eventInfo)}`);

  const user = await datasource.fetchOneUser(eventInfo?.data?.user?.userId, false);
  const transaction = eventInfo?.data?.transaction;

  // Create charges transaction record
  const chargesTransactionResponse = await datasource.createTransaction(
    transaction
  );

  if (!chargesTransactionResponse) {
    transactionLogger(
      user.userId,
      transaction,
      chargesTransactionResponse
    );
  }
});

module.exports = walletEvent;
