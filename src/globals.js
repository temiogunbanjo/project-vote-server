const output = {
  PUSH_NOTIFICATION_TOPIC: "",
  BONUS_GAME_ODDS_DROP: 0.05,
  MAX_SELECTION_ALLOWED: 20,
  MAX_NUMBER_OF_SLIP_IN_TICKET: 50,
  staticUploadPath: `${process.env.BASE_URL}/static`,
  DRAW_METHODS: {
    MANUAL_DRAW: 'manual',
    RNG_DRAW: 'RNG',
    INSTANT_DRAW: 'instant'
  },
  BONUS_TYPES: {
    BUNDLE: 'bundle-bonus',
    NORMAL: 'normal-bonus'
  },
  BONUS_STATUSES: {
    NONE: "none",
    PENDING: "pending",
    MATURED: "matured",
  },
  TRANSACTION_TYPES: {
    DEPOSIT: "deposit",
    CHARGE: "charge",
    WINNING: "winning",
    COMMISSION: "commission",
    WITHDRAWAL: "withdrawal",
  },
  SUSPENSION_TYPES: {
    OVERDRAFT: "overdraft-debt",
    ADMIN_SUSPENSION: "admin-suspension",
    AGENT_SUSPENSION: "agent-suspension",
  },
  WALLET_TYPES: {
    MAIN: "mainWallet",
    COMMISSION: "commissionWallet",
    BONUS: "bonusWallet",
  },
  WINNING_REDEMPTION_METHODS: {
    DPS: "dps",
    WALLET: "wallet",
    BANK: "bank",
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
