const express = require("express");
const router = express.Router();
const controller = require("../controllers/contentViewController");

router.post("/", controller.recordView);
router.get("/stats", controller.getStats);

module.exports = router;
