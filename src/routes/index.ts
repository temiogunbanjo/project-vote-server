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
router.post(
  "/upload",
  apiKeyMid,
  authmid,
  upload.single("image"),
  controllers.upload
);

module.exports = router;
