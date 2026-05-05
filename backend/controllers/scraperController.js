const axios = require('axios');
const cheerio = require('cheerio');
const Product = require('../models/Product');

// ---------------------------------------------------------------------------
// Helper – scrape a product page and extract title, price, and image.
// Strategy: tries multiple common CSS selectors in priority order so it works
// on a broad set of e-commerce sites (Amazon, eBay, Daraz, etc.).
// ---------------------------------------------------------------------------
const scrapeProductData = async (url) => {
  const { data: html } = await axios.get(url, {
    headers: {
      // Mimic a real browser to avoid bot-detection blocks
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(html);

  // --- Title ---
  const titleSelectors = [
    '#productTitle',           // Amazon
    '.product-title',
    '[data-testid="product-title"]',
    'h1.title',
    'h1',
  ];
  let title = '';
  for (const sel of titleSelectors) {
    const text = $(sel).first().text().trim();
    if (text) { title = text; break; }
  }

  // --- Price ---
  const priceSelectors = [
    '.a-price .a-offscreen',   // Amazon
    '.a-price-whole',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '[data-testid="price"]',
    '.price',
    '.product-price',
    '[itemprop="price"]',
    '.offer-price',
  ];
  let priceRaw = '';
  for (const sel of priceSelectors) {
    const el = $(sel).first();
    // Some elements store price in a content attribute (schema.org)
    const attrPrice = el.attr('content') || el.attr('data-price');
    const textPrice = el.text().trim();
    if (attrPrice) { priceRaw = attrPrice; break; }
    if (textPrice) { priceRaw = textPrice; break; }
  }
  // Strip all non-numeric characters except the decimal point
  const price = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || 0;

  // --- Image ---
  const imageSelectors = [
    '#landingImage',           // Amazon
    '#imgBlkFront',
    '.product-image img',
    '[data-testid="product-image"] img',
    'img.primary-image',
    'img[itemprop="image"]',
    '.gallery-image',
  ];
  let image = '';
  for (const sel of imageSelectors) {
    const el = $(sel).first();
    const src =
      el.attr('data-old-hires') ||   // Amazon high-res
      el.attr('data-src') ||
      el.attr('src') ||
      '';
    if (src && src.startsWith('http')) { image = src; break; }
  }

  // Fallback: grab the first large <img> on the page
  if (!image) {
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
        image = src;
        return false; // break
      }
    });
  }

  return { title: title || 'Unknown Product', price, image };
};

// ---------------------------------------------------------------------------
// Controller – Add a new product
// POST /api/products
// Body: { url, targetPrice }
// ---------------------------------------------------------------------------
const addProduct = async (req, res) => {
  try {
    const { url, targetPrice } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    const { title, price, image } = await scrapeProductData(url);

    const product = await Product.create({
      url,
      title,
      image,
      currentPrice: price,
      initialPrice: price,
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      priceHistory: [{ price, recordedAt: new Date() }],
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('addProduct error:', error.message);
    res.status(500).json({ message: 'Failed to add product', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Controller – Get all tracked products
// GET /api/products
// ---------------------------------------------------------------------------
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { title, price, image } = await scrapeProductData(product.url);

    product.title = title || product.title;
    product.image = image || product.image;
    product.currentPrice = price;
    product.priceHistory.push({ price, recordedAt: new Date() });

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error('refreshProduct error:', error.message);
    res.status(500).json({ message: 'Failed to refresh product', error: error.message });
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
    const product = await Product.findByIdAndUpdate(
      req.params.id,
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
    const product = await Product.findByIdAndDelete(req.params.id);
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
