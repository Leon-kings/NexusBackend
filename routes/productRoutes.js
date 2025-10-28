const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductStoreController');
const statsController = require('../controllers/statsController');
const { uploadMultiple } = require('../middleware/upload');

// Product routes
router.post('/', uploadMultiple, productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);
router.put('/:id', uploadMultiple, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Inventory management routes
router.post('/:id/sell', productController.sellProduct);
router.post('/:id/stock', productController.addStock);

// Statistics routes
router.get('/stats/inventory', statsController.getInventoryStats);
router.get('/stats/sales', statsController.getSalesStats);

module.exports = router;