const output = {
  PUSH_NOTIFICATION_TOPIC: "",
  staticUploadPath: `${process.env.BASE_URL}/static`,
  TRANSACTION_TYPES: {
    DEPOSIT: "deposit",
    CHARGE: "charge",
    WINNING: "winning",
    COMMISSION: "commission",
    WITHDRAWAL: "withdrawal",
  },
  WALLET_TYPES: {
    MAIN: "mainWallet",
    COMMISSION: "commissionWallet",
    BONUS: "bonusWallet",
  },
  weekDayNames: [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ],
  numberPositions: {
    1: 'st',
    2: 'nd',
    3: 'rd',
    default: 'th'
  }
};

module.exports = output;
