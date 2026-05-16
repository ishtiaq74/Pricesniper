const express = require('express');
const router = express.Router();
const {
  addProduct,
  getAllProducts,
  refreshProduct,
  updateTargetPrice,
  deleteProduct,
  getExchangeRates,
  searchProducts,
} = require('../controllers/scraperController');
const { protect } = require('../middleware/authMiddleware');

// All product routes require authentication
router.use(protect);

// @route   GET  /api/products
// @desc    Get all tracked products for the logged-in user
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

// ---------------------------------------------------------------------------
// FEATURE 1 — Live Currency Rates
// @route   GET  /api/products/rates
// @desc    Returns cached USD-based exchange rates (refreshed every 1 hour)
// ---------------------------------------------------------------------------
router.get('/rates', getExchangeRates);

// ---------------------------------------------------------------------------
// FEATURE 2 — Product Price Comparison (Google Custom Search)
// @route   GET  /api/products/search?q=productTitle
// @desc    Returns up to 5 web results for the given product title
// ---------------------------------------------------------------------------
router.get('/search', searchProducts);

module.exports = router;
