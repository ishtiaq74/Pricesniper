const Product = require('../models/Product');
const { scrapeProductData } = require('./scraperService');
const { AppError } = require('../middleware/errorHandler');

const formatScrapeError = (error, context) => {
  if (context === 'add') {
    if (error.message.includes('404')) {
      return 'Product not found — check the URL is correct and the product is available in your region.';
    }
    if (error.message.includes('bot-detection') || error.message.includes('403')) {
      return 'The website blocked our scraper. Please try again in a moment.';
    }
    if (error.message.includes('after 3 attempts')) {
      return error.message.replace('Failed to fetch', 'Could not reach');
    }
    return error.message;
  }

  if (context === 'refresh') {
    if (error.message.includes('404')) {
      return 'Product page returned 404 — the listing may have been removed.';
    }
    if (error.message.includes('after 3 attempts')) {
      return 'Could not reach the product page after multiple retries. Try again later.';
    }
    return error.message;
  }

  return error.message;
};

const addProductForUser = async (userId, { url, targetPrice }) => {
  if (!url) {
    throw new AppError('URL is required', 400);
  }

  try {
    const { title, price, currency, image } = await scrapeProductData(url);

    const product = await Product.create({
      userId,
      url,
      title,
      image,
      currency,
      currentPrice: price,
      initialPrice: price,
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      priceHistory: [{ price, recordedAt: new Date() }],
    });

    return product;
  } catch (error) {
    if (error.isOperational) throw error;
    const userMsg = formatScrapeError(error, 'add');
    throw new AppError(userMsg, 500);
  }
};

const getProductsForUser = async (userId) => {
  return Product.find({ userId }).sort({ createdAt: -1 });
};

const refreshProductForUser = async (userId, productId) => {
  const product = await Product.findOne({ _id: productId, userId });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  try {
    const { title, price, currency, image } = await scrapeProductData(product.url);

    product.title = title || product.title;
    product.image = image || product.image;
    product.currency = currency || product.currency;
    product.currentPrice = price;
    product.priceHistory.push({ price, recordedAt: new Date() });

    await product.save();
    return product;
  } catch (error) {
    if (error.isOperational) throw error;
    const userMsg = formatScrapeError(error, 'refresh');
    throw new AppError(userMsg, 500);
  }
};

const updateTargetForUser = async (userId, productId, targetPrice) => {
  const product = await Product.findOneAndUpdate(
    { _id: productId, userId },
    { targetPrice: parseFloat(targetPrice), alertSentAt: null },
    { new: true }
  );

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

const deleteProductForUser = async (userId, productId) => {
  return Product.findOneAndDelete({ _id: productId, userId });
};

module.exports = {
  addProductForUser,
  getProductsForUser,
  refreshProductForUser,
  updateTargetForUser,
  deleteProductForUser,
};
