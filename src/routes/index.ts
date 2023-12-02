const Validator = require("../middlewares/validatorMiddleWare");

const express = require("express");
const { default: controllers } = require("../controllers");
const authmid = require("../middlewares/authMid");
const apiKeyMid = require("../middlewares/apiKeyMid");
const adminLogMid = require("../middlewares/adminMid");
const upload = require("../middlewares/multerMiddleware");

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

// AUTH
router.post(
  "/auth",
  adminLogMid,
  Validator.selectValidation("username", "password"),
  Validator.validateRequest,
  controllers.authorize
);

// CAMPAIGNS
router.post("/campaign", adminLogMid, controllers.fetchAllCampaigns);
router.get("/campaigns", controllers.fetchAllCampaigns);
router.get("/campaign/:campaignId", controllers.fetchSingleCampaign);
router.put("/campaign/:campaignId", controllers.fetchSingleCampaign);

// CATEGORIES
router.post(
  "/campaigns/category",
  // adminLogMid,
  Validator.selectValidation("campaignId", "name", "description"),
  Validator.validateRequest,
  controllers.createCategory
);
router.get(
  "/campaigns/category/:categoryId",
  controllers.fetchSingleCategory
);
router.get(
  "/campaign/:campaignId/categories",
  controllers.fetchCampaignCategories
);
router.get("/campaigns/categories", controllers.fetchAllCategories);

// CANDIDATES
router.post(
  "/campaigns/category/add-candidate",
  // adminLogMid,
  Validator.selectValidation("fullname", "categoryId"),
  Validator.validateRequest,
  controllers.addNewCandidateToACategory
);

// SCHOOLS
router.get("/schools", controllers.fetchAllSchools);

module.exports = router;
