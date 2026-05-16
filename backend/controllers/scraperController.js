const {
  addProductForUser,
  getProductsForUser,
  refreshProductForUser,
  updateTargetForUser,
  deleteProductForUser,
} = require('../services/productService');
const { getRates } = require('../services/currencyService');
const { searchProduct } = require('../services/searchService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const addProduct = asyncHandler(async (req, res) => {
  const product = await addProductForUser(req.user._id, req.body);
  res.status(201).json(product);
});

const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await getProductsForUser(req.user._id);
    res.status(200).json(products);
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError('Failed to fetch products', 500, true, error.message);
  }
});

const refreshProduct = asyncHandler(async (req, res) => {
  const product = await refreshProductForUser(req.user._id, req.params.id);
  res.status(200).json(product);
});

const updateTargetPrice = asyncHandler(async (req, res) => {
  try {
    const product = await updateTargetForUser(
      req.user._id,
      req.params.id,
      req.body.targetPrice
    );
    res.status(200).json(product);
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError('Failed to update target price', 500, true, error.message);
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await deleteProductForUser(req.user._id, req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError('Failed to delete product', 500, true, error.message);
  }
});

const getExchangeRates = asyncHandler(async (req, res) => {
  try {
    const rates = await getRates();
    res.json({ rates });
  } catch (err) {
    throw new AppError('Failed to fetch exchange rates', 500, true, err.message);
  }
});

const searchProducts = asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) {
    return res.status(400).json({ message: 'Query parameter "q" is required' });
  }

  const results = await searchProduct(q);
  res.json({ results });
});

module.exports = {
  addProduct,
  getAllProducts,
  refreshProduct,
  updateTargetPrice,
  deleteProduct,
  getExchangeRates,
  searchProducts,
};
