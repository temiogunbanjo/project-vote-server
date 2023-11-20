const express = require("express");
const controllers = require("../controllers");
const adminLogMid = require("../middlewares/activityLogMid");
const authmid = require("../middlewares/authMid");
const apiKeyMid = require("../middlewares/apiKeyMid");
const upload = require("../middlewares/multerMiddleware");
const Validator = require("../middlewares/validatorMiddleWare");
// const { useAccessLog } = require('../middlewares/analytics');

const router = express.Router();

router.get("/health-check", controllers.healthCheck);

router.get("/p-a-d", apiKeyMid, authmid, controllers.peekAtDir);

router.get("/rng", authmid, controllers.TransactionTest);

router.get("/get-logs", controllers.getLogs);

router.delete("/clear-logs", apiKeyMid, controllers.clearLogs);

router.get("/fetch-performance-logs", controllers.getPerformanceLogs);

router.delete(
  "/clear-performance-logs",
  apiKeyMid,
  controllers.clearPerformanceLogs
);

router.get("/fetch-script-logs", controllers.getScriptLogs);

router.delete("/clear-script-logs", apiKeyMid, controllers.clearScriptLogs);

router.get("/fetch-transaction-logs", controllers.getTransactionLogs);

router.delete(
  "/clear-transaction-logs",
  apiKeyMid,
  controllers.clearTransactionLogs
);

router.get("/fetch-banks", apiKeyMid, controllers.fetchListOfBanks);

router.get("/fetch-roles", apiKeyMid, controllers.fetchRoles);

router.get("/fetch-analytics", apiKeyMid, authmid, controllers.fetchAnalytics);

router.get(
  "/analytics/fetch-devices",
  apiKeyMid,
  controllers.fetchDeviceAnalytics
);

router.get("/analytics/track-device", apiKeyMid, controllers.trackDevice);

router.post(
  "/upload",
  apiKeyMid,
  authmid,
  upload.single("image"),
  controllers.upload
);

router.post(
  "/upload-default-avatar",
  apiKeyMid,
  authmid,
  upload.single("avatarUrl"),
  controllers.uploadDefaultAvatar
);

router.get("/fetch-default-avatar", apiKeyMid, controllers.fetchDefaultAvatar);

// AUTH ENDPOINTS
router.post(
  "/auth/signup",
  Validator.validateSignUp,
  Validator.selectValidation("firstname", "lastname", "phone"),
  Validator.validateRequest,
  controllers.createUser
);

router.post(
  "/agent/signup",
  apiKeyMid,
  authmid,
  Validator.validateSignUp,
  Validator.selectValidation("firstname", "lastname", "role"),
  Validator.validateRequest,
  controllers.createAgent
);

router.post(
  "/auth/signup-with-ussd",
  Validator.validateLogin,
  Validator.validateRequest,
  controllers.createUserWithUssd
);

router.post(
  "/auth/login",
  Validator.validateLogin,
  Validator.selectValidation("password"),
  Validator.validateRequest,
  controllers.loginUser
);

router.post(
  "/auth/notifications/subcribe",
  apiKeyMid,
  authmid,
  Validator.selectValidation("deviceRegToken"),
  Validator.validateRequest,
  controllers.subscribeToPushNotification
);

router.post(
  "/auth/notifications/unsubcribe",
  apiKeyMid,
  authmid,
  controllers.unsubscribeToPushNotification
);

router.get("/auth/validate-token", apiKeyMid, controllers.validateToken);

router.post(
  "/auth/reset-password",
  Validator.selectValidation("email"),
  Validator.validateRequest,
  controllers.resetUserPassword
);

router.put(
  "/auth/update-password",
  Validator.selectValidation("token"),
  Validator.validatePasswordUpdate,
  Validator.validateRequest,
  controllers.updateUserPassword
);

router.post(
  "/user/send-verification-email",
  Validator.selectValidation("userId"),
  Validator.validateRequest,
  controllers.sendVerificationMail
);

router.get("/user/verify-email", controllers.verifyEmail);

router.get("/user/fetch-users", apiKeyMid, authmid, controllers.fetchAllUsers);

router.get(
  "/user/fetch-user/:userId",
  apiKeyMid,
  authmid,
  controllers.fetchUser
);

router.get("/user/refresh-login", apiKeyMid, authmid, controllers.refreshLogin);

router.get(
  "/user/fetch-authenticated-user",
  apiKeyMid,
  authmid,
  controllers.fetchCurrentUser
);

router.put(
  "/user/update-user/:userId",
  apiKeyMid,
  authmid,
  Validator.validateProfileUpdate,
  Validator.validateRequest,
  controllers.updateUser
);

router.put(
  "/user/update-avatar/:userId",
  apiKeyMid,
  authmid,
  upload.single("avatar"),
  controllers.updateUserAvatar
);

router.post(
  "/user/remove-affiliate",
  apiKeyMid,
  authmid,
  Validator.selectValidation("affiliateUserId"),
  Validator.validateRequest,
  controllers.delinkAffiliate
);

router.post(
  "/user/toggle-account-status",
  apiKeyMid,
  authmid,

  Validator.selectValidation("userId", "status"),
  Validator.validateRequest,
  controllers.enableOrDisableUser
);

router.get("/user/export", apiKeyMid, authmid, controllers.exportAllUsers);

router.get(
  "/user/analytics",
  apiKeyMid,
  authmid,

  controllers.fetchUserAnalytics
);

router.put(
  "/user/add-role",
  authmid,
  Validator.selectValidation("userId", "role"),
  Validator.validateRequest,
  controllers.addRoleToUser
);

// ADMIN ENDPOINTS
router.post(
  "/admin/signup",
  Validator.validateSignUp,
  Validator.selectValidation("role"),
  Validator.validateRequest,
  controllers.createAdminUser
);

router.post(
  "/admin/login",
  Validator.selectValidation("email", "password"),
  Validator.validateRequest,
  controllers.loginAdmin
);

router.put(
  "/admin/update-profile/:adminId",
  apiKeyMid,
  authmid,
  Validator.validateProfileUpdate,
  Validator.validateRequest,
  adminLogMid,
  controllers.updateAdmin
);

router.put(
  "/admin/promote-to-influencer",
  apiKeyMid,
  authmid,
  Validator.selectValidation("userId"),
  Validator.validateRequest,
  adminLogMid,
  controllers.upgradeToInfluencer
);

router.put(
  "/admin/assign-bonus-to-influencer",
  apiKeyMid,
  authmid,
  Validator.selectValidation("userId", "bonusId"),
  Validator.validateRequest,
  adminLogMid,
  controllers.assignBonusToInfluencer
);

router.get(
  "/admin/fetch-profile/:adminId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchAdmin
);

router.post(
  "/admin/send-verification-email",
  apiKeyMid,
  Validator.selectValidation("adminId"),
  Validator.validateRequest,
  controllers.sendAdminVerificationMail
);
router.get("/admin/verify-email", controllers.verifyAdminEmail);

router.get(
  "/admin/fetch-admins",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchAllAdmins
);

router.post(
  "/admin/toggle-account-status",
  apiKeyMid,
  authmid,
  Validator.selectValidation("adminId", "status"),
  Validator.validateRequest,
  controllers.enableOrDisableAdmin
);

router.get(
  "/admin/export",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.exportAllAdmins
);

router.get(
  "/admin/analytics",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchAdminAnalytics
);

router.get(
  "/admin/fetch-activities",
  apiKeyMid,
  authmid,

  adminLogMid,
  controllers.fetchAdminActivity
);

router.post(
  "/admin/approve-withdrawal-request",
  apiKeyMid,
  authmid,

  Validator.selectValidation("requestId"),
  Validator.validateRequest,
  adminLogMid,
  controllers.approveWithdrawalRequest
);

router.get(
  "/admin/fetch-sales-report",
  apiKeyMid,
  authmid,

  adminLogMid,
  controllers.fetchAdminSalesReport
);

router.post(
  "/admin/send-notification",
  apiKeyMid,
  authmid,

  Validator.selectValidation("message", "title", "group"),
  Validator.validateRequest,
  adminLogMid,
  controllers.adminSendPushNotification
);

router.put(
  "/agent/update-profile/:userId",
  apiKeyMid,
  authmid,

  Validator.validateProfileUpdate,
  Validator.validateRequest,
  controllers.updateAgent
);

router.put(
  "/agent/update-password",
  authmid,
  // Validator.validatePasswordUpdate,
  // Validator.validatePinUpdate,
  // Validator.validateRequest,
  controllers.updateAgentPasswordAndPin
);

router.put(
  "/agent/update-avatar/:userId",
  apiKeyMid,
  authmid,
  upload.single("avatar"),
  controllers.updateUserAvatar
);

router.put(
  "/agent/update-multiplier/:userId",
  apiKeyMid,
  authmid,
  Validator.selectValidation("multiplier"),
  Validator.validateRequest,
  controllers.updateAgentMultiplier
);

router.post(
  "/agent/send-verification-email",
  apiKeyMid,

  Validator.selectValidation("userId"),
  Validator.validateRequest,
  controllers.sendVerificationMailToAgents
);
router.get("/agent/verify-email", controllers.verifyAgentEmail);

router.get(
  "/agent/fetch-agent/:userId",
  apiKeyMid,
  authmid,

  controllers.fetchAgent
);

router.get(
  "/agent/fetch-agents",
  apiKeyMid,
  authmid,
  controllers.fetchAllAgents
);

router.post(
  "/agent/toggle-account-status",
  apiKeyMid,
  authmid,
  Validator.selectValidation("userId", "status"),
  Validator.validateRequest,
  controllers.enableOrDisableAgent
);

router.post(
  "/agent/suspend-downline",
  apiKeyMid,
  authmid,
  Validator.selectValidation("userId"),
  Validator.validateRequest,
  controllers.suspendDownline
);

router.post(
  "/agent/reactivate-downline",
  apiKeyMid,
  authmid,
  Validator.selectValidation("userId"),
  Validator.validateRequest,
  controllers.reactivateDownline
);

router.get(
  "/agent/export",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.exportAllAgents
);

router.get(
  "/agent/analytics",
  apiKeyMid,
  authmid,
  controllers.fetchAgentAnalytics
);

router.get(
  "/agent/fetch-sales-report",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchAgentSalesReport
);

// TRANSACTIONS ENDPOINTS
router.get(
  "/transactions/fetch-transactions",
  apiKeyMid,
  authmid,
  controllers.fetchAllTransactions
);

router.get(
  "/transactions/fetch-admin-transactions",
  apiKeyMid,
  authmid,
  controllers.fetchAllAdminTransactions
);

router.get(
  "/transactions/fetch-overdrafts",
  apiKeyMid,
  authmid,
  controllers.fetchAllOverdrafts
);

router.get(
  "/transactions/fetch-single-overdraft/:transactionId",
  apiKeyMid,
  authmid,
  controllers.fetchSingleOverdraft
);

router.get(
  "/transactions/fetch-transaction/:transactionId",
  apiKeyMid,
  authmid,
  controllers.fetchSingleTransaction
);

router.post(
  "/transactions/reverse-transaction",
  apiKeyMid,
  authmid,
  Validator.selectValidation("transactionId"),
  Validator.validateRequest,
  controllers.reverseSingleTransaction
);

router.get(
  "/transactions/export",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.exportAllTransactions
);

router.get(
  "/transactions/analytics",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchTransactionAnalytics
);

router.get(
  "/transactions/fetch-withdrawal-requests",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchAllWithdrawalRequests
);

router.get(
  "/transactions/fetch-withdrawal-request/:requestId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSingleWithdrawalRequest
);

// WALLET ENDPOINTS
router.put(
  "/wallet/topup",
  apiKeyMid,
  authmid,
  Validator.selectValidation("amount", "narration", "payReference", "provider"),
  Validator.validateRequest,
  controllers.topupWalletBalance
);

router.put(
  "/wallet/debit-wallet",
  apiKeyMid,
  authmid,
  Validator.selectValidation(
    "amount",
    "narration",
    "debitedUserId",
    "targetWallet"
  ),
  Validator.validateRequest,
  adminLogMid,
  controllers.debitWalletBalance
);

router.get(
  "/wallet/fetch-total-bonus-balance",
  apiKeyMid,
  authmid,
  controllers.fetchTotalBonusBalance
);

router.post(
  "/wallet/transfer-commission-to-main-wallet",
  apiKeyMid,
  authmid,
  Validator.selectValidation("amount", "transactionPin"),
  Validator.validateRequest,
  controllers.commissionToMainWalletTransfer
);

router.get(
  "/commissions/get-aggregate-commissions",
  apiKeyMid,
  authmid,
  controllers.fetchAllCommissionAggregates
);

router.post(
  "/commissions/update-commission-eligibility-status",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.updateCommissionEligibiltyStatus
);

router.post(
  "/commissions/confirm-approval1-commissions",
  apiKeyMid,
  authmid,
  controllers.handleUpdateApproval1Comms
);
router.post(
  "/commissions/confirm-approval2-commissions",
  apiKeyMid,
  authmid,
  controllers.handleUpdateApproval2Comms
);

router.post(
  "/commissions/confirm-approval3-commissions",
  apiKeyMid,
  authmid,
  controllers.handleUpdateApproval3Comms
);
router.post(
  "/wallet/bank-withdrawal/initialize",
  apiKeyMid,
  authmid,
  Validator.selectValidation("amount"),
  Validator.validateRequest,
  controllers.withdrawFromWallet
);

router.post(
  "/wallet/bank-withdrawal/finalize-with-otp",
  apiKeyMid,
  authmid,
  Validator.selectValidation("otp", "transactionId"),
  Validator.validateRequest,
  controllers.finalizeWalletWithdrawal
);

router.post(
  "/wallet/transfer-fund-to-user",
  apiKeyMid,
  authmid,
  Validator.selectValidation("receipientId", "amount", "transactionPin"),
  Validator.validateRequest,
  controllers.shareFundsWithUsers
);

router.post(
  "/wallet/transfer-fund-to-agent",
  apiKeyMid,
  authmid,
  Validator.selectValidation("receipientId", "amount", "transactionPin"),
  Validator.validateRequest,
  controllers.shareFundsWithSimilarAgents
);

router.get(
  "/wallet/fetch-shared-funds",
  apiKeyMid,
  authmid,
  controllers.fetchAllUserSharedFunds
);

router.post(
  "/wallet/send-overdraft",
  apiKeyMid,
  authmid,
  Validator.selectValidation("receipientId", "amount"),
  Validator.validateRequest,
  controllers.sendOverdraftToDownline
);

router.post(
  "/wallet/repay-overdraft",
  apiKeyMid,
  authmid,
  Validator.selectValidation("transactionId", "amount"),
  Validator.validateRequest,
  controllers.returnOverdraftToUpline
);

router.put(
  "/wallet/setup-pin",
  apiKeyMid,
  authmid,
  Validator.selectValidation("transactionPin"),
  Validator.validateRequest,
  controllers.setupWalletPin
);

router.post(
  "/wallet/initiate-pin-modification",
  apiKeyMid,
  authmid,
  controllers.initiatePinModification
);

router.put(
  "/wallet/finalize-pin-modification",
  apiKeyMid,
  Validator.selectValidation("transactionPin", "token"),
  Validator.validateRequest,
  controllers.finalizePinModification
);

router.get(
  "/wallet/fetch-sent-overdraft",
  apiKeyMid,
  authmid,

  controllers.fetchSentOverdraft
);
router.get(
  "/wallet/fetch-admin-sent-overdraft",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchAllAdminSentOverdrafts
);

router.get(
  "/wallet/fetch-received-overdraft",
  apiKeyMid,
  authmid,
  controllers.fetchReceivedOverdraft
);

router.get(
  "/wallet/fetch-history",
  apiKeyMid,
  authmid,
  controllers.fetchWalletHistory
);

router.get(
  "/wallet/fetch-history/:transactionId",
  apiKeyMid,
  authmid,
  controllers.fetchSingleWalletHistory
);

router.get(
  "/wallet/fetch-withdrawal-requests",
  apiKeyMid,
  authmid,
  controllers.fetchWithdrawalRequestsForUser
);

router.post(
  "/wallet/cancel-withdrawal-request",
  apiKeyMid,
  authmid,
  Validator.selectValidation("requestId"),
  Validator.validateRequest,
  controllers.cancelWithdrawalRequest
);

router.get(
  "/wallet/export-history",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.exportWalletHistory
);

// PAYOUTS
router.get(
  "/payout/fetch-payout/:payoutId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSinglePayout
);

router.get(
  "/payout/fetch-payouts",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchAllPayouts
);

// GAME ENDPOINTS
router.post(
  "/game/create-lottery",
  apiKeyMid,
  authmid,
  upload.fields([{ name: "imageUrl" }, { name: "audioUrl" }]),
  Validator.selectValidation(
    "lotteryName",
    "slug",
    "category",
    "betOptions",
    "boosterOptions",
    "resultOptions",
    "setA",
    "setB"
  ),
  Validator.validateRequest,
  adminLogMid,
  controllers.createLottery
);

router.get(
  "/game/fetch-lottery/:lotteryId",
  apiKeyMid,
  authmid,
  controllers.fetchSingleLottery
);

router.get(
  "/game/fetch-lottery-by-slug/:slug",
  apiKeyMid,
  controllers.fetchLotteryBySlug
);

router.get("/game/fetch-lotteries", apiKeyMid, controllers.fetchAllLotteries);

router.put(
  "/game/update-lottery/:lotteryId",
  apiKeyMid,
  authmid,

  upload.fields([{ name: "imageUrl" }, { name: "audioUrl" }]),
  Validator.validateLotteryUpdate,
  Validator.validateRequest,
  adminLogMid,
  controllers.updateLottery
);

router.delete(
  "/game/delete-lottery/:lotteryId",
  apiKeyMid,
  authmid,

  adminLogMid,
  controllers.deleteLottery
);

router.post(
  "/game/toggle-lottery-status",
  apiKeyMid,
  authmid,

  Validator.selectValidation("lotteryId", "status"),
  Validator.validateRequest,
  adminLogMid,
  controllers.enableOrDisableLottery
);

router.get(
  "/game/lottery/analytics",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchLotteryAnalytics
);

router.post(
  "/game/create-game",
  apiKeyMid,
  authmid,
  Validator.validateGame,
  Validator.validateRequest,
  adminLogMid,
  controllers.createNewGame
);

router.post(
  "/game/create-instant-game",
  apiKeyMid,
  authmid,
  Validator.selectValidation(
    "name",
    "lotteryId",
    "description",
    "recurringInterval"
  ),
  Validator.validateRequest,
  adminLogMid,
  controllers.createInstantGame
);

router.get("/game/fetch-games", apiKeyMid, controllers.fetchAllGames);

router.get(
  "/game/fetch-game-schedule",
  apiKeyMid,
  controllers.fetchAllGameSchedule
);

router.get("/game/fetch-game/:gameId", apiKeyMid, controllers.fetchGame);

router.put(
  "/game/update-game/:gameId",
  apiKeyMid,
  authmid,

  Validator.optionalGameValidation,
  Validator.validateRequest,
  adminLogMid,
  controllers.updateGame
);

router.get(
  "/game/instances/analytics",
  apiKeyMid,
  authmid,

  adminLogMid,
  controllers.fetchGameAnalytics
);

router.get(
  "/game/instances/analytics/:gameId",
  apiKeyMid,
  authmid,

  adminLogMid,
  controllers.fetchSingleGameAnalytics
);

router.delete(
  "/game/delete-game/:gameId",
  apiKeyMid,
  authmid,

  adminLogMid,
  controllers.deleteGame
);

router.post(
  "/game/toggle-game-status",
  apiKeyMid,
  authmid,

  Validator.selectValidation("gameId", "status"),
  Validator.validateRequest,
  adminLogMid,
  controllers.enableOrDisableGame
);

router.get(
  "/game/fetch-current-game",
  apiKeyMid,

  controllers.fetchCurrentGame
);

router.post(
  "/game/create-ticket",
  apiKeyMid,
  authmid,

  Validator.validateCreateTicket,
  Validator.selectValidation("winningRedemptionMethod"),
  Validator.validateRequest,
  controllers.createNewTicket
);

router.post(
  "/game/ticket/get-potential-winning",
  apiKeyMid,
  authmid,

  Validator.selectValidation("lotteryId", "betSlips"),
  Validator.validateRequest,
  controllers.getTicketPotentials
);

router.get(
  "/game/ticket/fetch-combo-description",
  apiKeyMid,

  Validator.validateComboQueryParams,
  Validator.validateRequest,
  controllers.fetchComboDescription
);

router.get(
  "/game/fetch-tickets/:userId",
  apiKeyMid,
  authmid,
  controllers.fetchAllTicketForUser
);

router.get(
  "/game/fetch-tickets",
  apiKeyMid,
  authmid,
  controllers.fetchAllTickets
);

router.get(
  "/game/fetch-ticket/:ticketId",
  apiKeyMid,

  controllers.fetchSingleTicket
);

router.put(
  "/game/update-ticket/:ticketId",
  apiKeyMid,
  authmid,

  controllers.updateTicket
);

router.post(
  "/game/blacklist-ticket",
  apiKeyMid,
  authmid,
  Validator.selectValidation("ticketId"),
  Validator.validateRequest,
  adminLogMid,
  controllers.blacklistTicket
);

router.post(
  "/game/unblacklist-ticket",
  apiKeyMid,
  authmid,
  Validator.selectValidation("ticketId"),
  Validator.validateRequest,
  adminLogMid,
  controllers.unblacklistTicket
);

router.post(
  "/game/block-ticket",
  apiKeyMid,
  authmid,
  Validator.selectValidation("ticketId", "passcode"),
  Validator.validateRequest,
  controllers.blockUserTicket
);

router.post(
  "/game/send-ticket-block-passcode",
  apiKeyMid,
  authmid,
  Validator.selectValidation("ticketId", "email"),
  Validator.validateRequest,
  controllers.sendTicketBlockingPasscode
);

router.post(
  "/game/unblock-ticket",
  apiKeyMid,
  authmid,
  Validator.selectValidation("ticketId", "passcode"),
  Validator.validateRequest,
  controllers.unblockUserTicket
);

router.delete(
  "/game/delete-ticket/:ticketId",
  apiKeyMid,
  authmid,
  controllers.deleteTicket
);

router.post(
  "/game/cancel-ticket",
  apiKeyMid,
  authmid,
  Validator.selectValidation("ticketId"),
  Validator.validateRequest,
  controllers.cancelTicket
);

router.get(
  "/game/fetch-ticket-result/:ticketId",
  apiKeyMid,
  controllers.fetchTicketResult
);

router.post(
  "/game/ticket/claim-dps-winning",
  apiKeyMid,
  authmid,
  Validator.selectValidation("redemptionCode"),
  Validator.validateRequest,
  controllers.claimDPSWinning
);

router.post(
  "/game/save-ticket",
  apiKeyMid,
  authmid,

  Validator.selectValidation("gameId", "totalStakedAmount", "betSlips"),
  Validator.validateRequest,
  controllers.saveTicket
);

router.get(
  "/game/fetch-saved-tickets/:userId",
  apiKeyMid,
  authmid,

  controllers.fetchUserSavedTickets
);

router.get(
  "/game/fetch-saved-tickets",
  apiKeyMid,
  authmid,

  adminLogMid,
  controllers.fetchSavedTickets
);

router.get(
  "/game/fetch-saved-ticket/:ticketId",
  apiKeyMid,
  authmid,
  controllers.fetchSingleSavedTicket
);

router.get(
  "/game/fetch-ticket-by-code/:bookingCode",
  apiKeyMid,
  authmid,
  controllers.fetchTicketByBookingCode
);

router.get(
  "/game/fetch-booking-code-users/:bookingCode",
  apiKeyMid,
  authmid,
  controllers.fetchBookingCodeUsers
);

router.get(
  "/game/ticket/export",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.exportAllTickets
);

router.post(
  "/game/save-played-ticket/:ticketId",
  apiKeyMid,
  authmid,
  controllers.sharePlayedTicket
);

router.get(
  "/game/ticket/analytics",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchTicketAnalytics
);

router.get(
  "/game/fetch-forecast/:gameId",
  apiKeyMid,
  controllers.fetchGameForecast
);

router.get(
  "/game/fetch-result-statistics",
  apiKeyMid,
  controllers.fetchStatistics
);

router.post(
  "/game/create-result",
  apiKeyMid,
  authmid,
  Validator.selectValidation("gameId", "gameDate"),
  Validator.validateRequest,
  adminLogMid,
  controllers.createGameResult
);

router.get(
  "/game/fetch-rng-log",
  apiKeyMid,
  authmid,
  controllers.getRNGLogs
);

router.post(
  "/game/create-instant-result",
  apiKeyMid,
  authmid,
  Validator.selectValidation("ticketId"),
  Validator.validateRequest,
  controllers.createInstantGameResult
);

router.post(
  "/game/upload-legendary-lotto-result",
  apiKeyMid,
  authmid,
  upload.single("legendaryLottoResult"),
  controllers.uploadLegendaryLottoResult
);

router.get(
  "/game/fetch-result-history",
  apiKeyMid,
  controllers.fetchResultHistory
);

router.get(
  "/game/fetch-result-history-by-game/:gameId",
  apiKeyMid,
  authmid,
  controllers.fetchResultHistoryByGameId
);

router.get(
  "/game/fetch-raffle-results",
  apiKeyMid,
  controllers.fetchRaffleResult
);

router.get(
  "/game/fetch-result/:resultId",
  apiKeyMid,
  authmid,
  controllers.fetchSingleResult
);

router.get(
  "/game/fetch-pending-results",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchPendingResults
);

router.put(
  "/game/update-result/:resultId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.updateGameResult
);

router.post(
  "/game/approve-result",
  apiKeyMid,
  authmid,

  Validator.selectValidation("resultId"),
  Validator.validateRequest,
  adminLogMid,
  controllers.approveGameResult
);

router.post(
  "/game/reverse-result",
  apiKeyMid,
  authmid,

  Validator.selectValidation("resultId"),
  Validator.validateRequest,
  adminLogMid,
  controllers.reverseGameResult
);

router.get(
  "/game/fetch-winning-analytics",
  apiKeyMid,
  authmid,

  // adminLogMid,
  controllers.fetchWinningAnalytics
);

router.get(
  "/game/fetch-recent-winners",
  apiKeyMid,
  controllers.fetchRecentWinners
);

router.get(
  "/game/fetch-game-options",
  apiKeyMid,
  authmid,
  controllers.fetchAllGameOptions
);

router.post(
  "/bonus/create-bonus",
  apiKeyMid,
  authmid,
  Validator.selectValidation("title", "prize"),
  Validator.validateBonus,
  Validator.validateRequest,
  adminLogMid,
  controllers.createBonus
);

router.get(
  "/bonus/fetch-bonus/:bonusId",
  apiKeyMid,
  authmid,
  controllers.fetchSingleBonus
);

router.get(
  "/bonus/fetch-all-bonuses",
  apiKeyMid,
  authmid,
  controllers.fetchAllBonuses
);

router.put(
  "/bonus/update-bonus/:bonusId",
  apiKeyMid,
  authmid,
  Validator.validateBonus,
  Validator.validateRequest,
  adminLogMid,
  controllers.updateBonus
);

router.post(
  "/bonus/activate-bonus",
  apiKeyMid,
  authmid,
  Validator.selectValidation("bonusId"),
  Validator.validateRequest,
  adminLogMid,
  controllers.activateBonus
);

router.post(
  "/bonus/deactivate-bonus",
  apiKeyMid,
  authmid,
  Validator.selectValidation("bonusId"),
  Validator.validateRequest,
  adminLogMid,
  controllers.deactivateBonus
);

router.post(
  "/bonus/apply-for-bonus",
  apiKeyMid,
  authmid,
  Validator.selectValidation("bonusId"),
  Validator.validateRequest,
  controllers.applyForBonus
);

router.get(
  "/bonus/fetch-applied-bonus/:bonusId",
  apiKeyMid,
  authmid,
  controllers.fetchSingleUserAppliedBonus
);

router.get(
  "/bonus/fetch-applied-bonuses",
  apiKeyMid,
  authmid,
  controllers.fetchAllAppliedBonuses
);

router.post(
  "/bonus/create-reseller-bundle",
  apiKeyMid,
  authmid,
  Validator.selectValidation(
    "sourceBundleId",
    "moq",
    "unitCost",
    "bundleQuantity"
  ),
  Validator.validateRequest,
  controllers.createResellerBundle
);

router.get(
  "/bonus/fetch-reseller-bundle/:bundleId",
  apiKeyMid,
  authmid,
  controllers.fetchSingleBundle
);

router.put(
  "/bonus/update-reseller-bundle/:bundleId",
  apiKeyMid,
  authmid,
  controllers.updateResellerBundle
);

router.get(
  "/bonus/fetch-reseller-bundles",
  apiKeyMid,
  authmid,
  controllers.fetchAllBundles
);

router.get(
  "/bonus/fetch-my-bundles",
  apiKeyMid,
  authmid,
  controllers.fetchAllUserBundles
);

router.post(
  "/bonus/buy-bundle",
  apiKeyMid,
  authmid,
  Validator.selectValidation("bundleId"),
  Validator.validateRequest,
  controllers.buyBundle
);

router.post(
  "/bonus/convert-bundle-to-bonus",
  apiKeyMid,
  authmid,
  Validator.selectValidation("bundleId"),
  Validator.validateRequest,
  controllers.moveBundleToBonusWallet
);

router.get(
  "/bonus/fetch-bonus-transactions",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchAllBonusTransactions
);

router.get(
  "/bonus/fetch-bonus-transaction/:bonusId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSingleBonusTransaction
);

router.get(
  "/bonus/fetch-bundle-transactions",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchAllBundleTransactions
);

router.get(
  "/bonus/fetch-bundle-transaction/:bonusId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSingleBundleTransaction
);

// BANNER
router.post(
  "/banner/create-banner",
  apiKeyMid,
  authmid,
  Validator.selectValidation("title", "content", "category", "imageUrl"),
  Validator.validateRequest,
  adminLogMid,
  controllers.createBanner
);

router.get(
  "/banner/fetch-banner/:bannerId",
  apiKeyMid,
  controllers.fetchSingleBanner
);

router.get("/banner/fetch-banners", apiKeyMid, controllers.fetchAllBanners);

router.put(
  "/banner/update-banner/:bannerId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.updateBanner
);

router.post(
  "/banner/activate-banner/:bannerId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.activateBanner
);

router.post(
  "/banner/deactivate-banner/:bannerId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.deactivateBanner
);

router.post(
  "/content/create-content",
  apiKeyMid,
  authmid,
  Validator.selectValidation("title", "description", "content", "slug"),
  Validator.validateRequest,
  controllers.createContent
);

router.get(
  "/content/fetch-content/:contentId",
  apiKeyMid,
  controllers.fetchSingleContent
);

router.get(
  "/content/fetch-content-by-slug/:slug",
  apiKeyMid,
  controllers.fetchContentBySlug
);

router.get("/content/fetch-contents", apiKeyMid, controllers.fetchAllContents);

router.put(
  "/content/update-content/:contentId",
  apiKeyMid,
  authmid,
  controllers.updateContent
);

router.post(
  "/content/activate-content/:contentId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.activateContent
);

router.post(
  "/content/deactivate-content/:contentId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.deactivateContent
);

router.post(
  "/site-settings/create-settings",
  apiKeyMid,
  authmid,
  Validator.selectValidation("title", "content"),
  Validator.validateRequest,
  adminLogMid,
  controllers.createSettings
);

router.get(
  "/site-settings/fetch-setting/:settingId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSingleSetting
);

router.get(
  "/site-settings/fetch-setting-by-slug/:slug",
  apiKeyMid,
  controllers.fetchSettingWithSlug
);

router.get(
  "/site-settings/fetch-settings",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchAllSettings
);

router.put(
  "/site-settings/update-setting/:settingId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.updateSettings
);

router.put(
  "/site-settings/update-game-category-icon",
  apiKeyMid,
  authmid,
  upload.single("categoryImage"),
  Validator.selectValidation("category"),
  Validator.validateRequest,
  adminLogMid,
  controllers.updateCategoryImage
);

router.delete(
  "/site-settings/delete-setting/:settingId",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.deleteSettings
);

router.get(
  "/admin/fetch-specific-player-report",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSpecificPlayerReport
);

router.get(
  "/admin/fetch-specific-single-player-report",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSpecificSinglePlayerReport
);

router.get(
  "/admin/fetch-specific-agent-report",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSpecificAgentReport
);

router.get(
  "/admin/fetch-specific-single-agent-report",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSpecificSingleAgentReport
);

router.get(
  "/admin/commissions/fetch-specific-player-report",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSpecificCommissionPlayerReport
);

router.get(
  "/admin/commissions/fetch-specific-single-player-report",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSpecificCommissionSinglePlayerReport
);

router.get(
  "/admin/commissions/fetch-specific-agent-report",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSpecificCommissionAgentReport
);

router.get(
  "/admin/commissions/fetch-specific-single-agent-report",
  apiKeyMid,
  authmid,
  adminLogMid,
  controllers.fetchSpecificCommissionSingleAgentReport
);

router.get(
  "/agent/commissions/fetch-specific-agent-report",
  apiKeyMid,
  authmid,
  controllers.fetchSpecificAgentCommissionReportRole
);

router.get(
  "/agent/fetch-specific-agent-report",
  apiKeyMid,
  authmid,
  controllers.fetchSpecificAgentReportRole
);

router.get(
  "/agent/commissions/fetch-specific-single-agent-report",
  apiKeyMid,
  authmid,
  controllers.fetchSpecificAgentcommissionsReports
);

router.get(
  "/player/commissions/fetch-specific-player-report",
  apiKeyMid,
  authmid,
  controllers.fetchSpecificPlayercommissionsReports
);

router.get(
  "/agent/fetch-specific-single-agent-report",
  apiKeyMid,
  authmid,
  controllers.fetchSpecificAgentReports
);

router.get(
  "/player/fetch-specific-player-report",
  apiKeyMid,
  authmid,
  controllers.fetchSpecificPlayerReports
);

module.exports = router;
