const express = require('express');
const router = express.Router();
const {
  addProduct,
  getAllProducts,
  refreshProduct,
  updateTargetPrice,
  deleteProduct,
} = require('../controllers/scraperController');

// @route   GET  /api/products
// @desc    Get all tracked products
router.get('/', getAllProducts);

// @route   POST /api/products
// @desc    Add a new product (triggers first scrape)
router.post('/', addProduct);

// @route   PUT  /api/products/:id/refresh
// @desc    Re-scrape a product and update price history
router.put('/:id/refresh', refreshProduct);

// @route   PUT  /api/products/:id/target
// @desc    Update the target price for a product
router.put('/:id/target', updateTargetPrice);

// @route   DELETE /api/products/:id
// @desc    Remove a product from tracking
router.delete('/:id', deleteProduct);

module.exports = router;
