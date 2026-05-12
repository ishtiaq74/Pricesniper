const Product = require('../models/Product');
const { scrapeProductData } = require('../services/scraperService');


// ---------------------------------------------------------------------------
// Controller – Add a new product (protected — requires auth)
// POST /api/products
// Body: { url, targetPrice }
// ---------------------------------------------------------------------------
const addProduct = async (req, res) => {
  try {
    const { url, targetPrice } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    const { title, price, currency, image } = await scrapeProductData(url);

    const product = await Product.create({
      userId: req.user._id,
      url,
      title,
      image,
      currency,
      currentPrice: price,
      initialPrice: price,
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      priceHistory: [{ price, recordedAt: new Date() }],
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('addProduct error:', error.message);
    // Surface the scraper's specific error to the client
    const userMsg = error.message.includes('404')
      ? 'Product not found — check the URL is correct and the product is available in your region.'
      : error.message.includes('bot-detection') || error.message.includes('403')
        ? 'The website blocked our scraper. Please try again in a moment.'
        : error.message.includes('after 3 attempts')
          ? error.message.replace('Failed to fetch', 'Could not reach')
          : error.message;
    res.status(500).json({ message: userMsg });
  }
};

// ---------------------------------------------------------------------------
// Controller – Get all tracked products for the logged-in user
// GET /api/products
// ---------------------------------------------------------------------------
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error('getAllProducts error:', error.message);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Controller – Manual refresh (re-scrape and append to price history)
// PUT /api/products/:id/refresh
// ---------------------------------------------------------------------------
const refreshProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { title, price, currency, image } = await scrapeProductData(product.url);

    product.title = title || product.title;
    product.image = image || product.image;
    product.currency = currency || product.currency;
    product.currentPrice = price;
    product.priceHistory.push({ price, recordedAt: new Date() });

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error('refreshProduct error:', error.message);
    const userMsg = error.message.includes('404')
      ? 'Product page returned 404 — the listing may have been removed.'
      : error.message.includes('after 3 attempts')
        ? 'Could not reach the product page after multiple retries. Try again later.'
        : error.message;
    res.status(500).json({ message: userMsg });
  }
};

// ---------------------------------------------------------------------------
// Controller – Update target price
// PUT /api/products/:id/target
// Body: { targetPrice }
// ---------------------------------------------------------------------------
const updateTargetPrice = async (req, res) => {
  try {
    const { targetPrice } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { targetPrice: parseFloat(targetPrice) },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    console.error('updateTargetPrice error:', error.message);
    res.status(500).json({ message: 'Failed to update target price', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Controller – Delete a product
// DELETE /api/products/:id
// ---------------------------------------------------------------------------
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('deleteProduct error:', error.message);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  refreshProduct,
  updateTargetPrice,
  deleteProduct,
};
