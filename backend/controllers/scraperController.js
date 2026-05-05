const axios = require('axios');
const cheerio = require('cheerio');
const Product = require('../models/Product');

// ---------------------------------------------------------------------------
// Helper – extract currency symbol from a raw price string.
// Checks for common symbols and text codes before falling back to '$'.
// ---------------------------------------------------------------------------
const extractCurrency = (raw) => {
  if (!raw) return '$';
  const str = raw.toString().trim();

  // Text codes first (longer matches before single-char checks)
  if (/TK|BDT/i.test(str)) return '৳';
  if (/INR/i.test(str)) return '₹';
  if (/USD/i.test(str)) return '$';
  if (/EUR/i.test(str)) return '€';
  if (/GBP/i.test(str)) return '£';
  if (/JPY/i.test(str)) return '¥';

  // Symbol characters
  if (str.includes('৳')) return '৳';
  if (str.includes('₹')) return '₹';
  if (str.includes('€')) return '€';
  if (str.includes('£')) return '£';
  if (str.includes('¥')) return '¥';
  if (str.includes('₩')) return '₩';
  if (str.includes('₺')) return '₺';
  if (str.includes('₫')) return '₫';
  if (str.includes('฿')) return '฿';
  if (str.includes('$')) return '$';

  return '$';
};

// ---------------------------------------------------------------------------
// Helper – scrape a product page and extract title, price, currency, image.
// Strategy: tries multiple common CSS selectors in priority order.
// ---------------------------------------------------------------------------
const scrapeProductData = async (url) => {
  const { data: html } = await axios.get(url, {
    headers: {
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

  // --- Price (raw string kept to extract currency) ---
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
    '.woocommerce-Price-amount',
  ];
  let priceRaw = '';
  for (const sel of priceSelectors) {
    const el = $(sel).first();
    const attrPrice = el.attr('content') || el.attr('data-price');
    const textPrice = el.text().trim();
    if (attrPrice) { priceRaw = attrPrice; break; }
    if (textPrice) { priceRaw = textPrice; break; }
  }

  // Extract currency from raw price string
  const currency = extractCurrency(priceRaw);

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

  return { title: title || 'Unknown Product', price, currency, image };
};

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
    res.status(500).json({ message: 'Failed to add product', error: error.message });
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
