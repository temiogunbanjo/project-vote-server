const express = require("express");
const { default: controllers } = require("../controllers");
const adminLogMid = require("../middlewares/activityLogMid");
const authmid = require("../middlewares/authMid");
const apiKeyMid = require("../middlewares/apiKeyMid");
const upload = require("../middlewares/multerMiddleware");
const Validator = require("../middlewares/validatorMiddleWare");
// const { useAccessLog } = require('../middlewares/analytics');

const router = express.Router();

router.get("/health-check", controllers.healthCheck);
router.get("/p-a-d", apiKeyMid, authmid, controllers.peekAtDir);

router.get("/get-logs", controllers.getLogs);
router.delete("/clear-logs", apiKeyMid, controllers.clearLogs);
router.get("/fetch-transaction-logs", controllers.getTransactionLogs);
router.delete(
  "/clear-transaction-logs",
  apiKeyMid,
  controllers.clearTransactionLogs
);

router.post(
  "/upload",
  apiKeyMid,
  authmid,
  upload.single("image"),
  controllers.upload
);

// CAMPAIGNS
router.get("/campaigns", controllers.fetchAllCampaigns);
router.get("/campaigns/:campaignId", controllers.fetchAllCampaigns);

module.exports = router;
