const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/sold", orderController.getSoldProducts);
router.get("/stats", orderController.getOrderStats);

module.exports = router;
