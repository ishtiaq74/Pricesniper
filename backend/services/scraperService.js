const axios   = require('axios');
const cheerio = require('cheerio');

// ---------------------------------------------------------------------------
// Helper – extract currency symbol from a raw price string.
// ---------------------------------------------------------------------------
const extractCurrency = (raw) => {
  if (!raw) return '$';
  const str = raw.toString().trim();

  if (/TK|BDT/i.test(str)) return '৳';
  if (/INR/i.test(str))    return '₹';
  if (/USD/i.test(str))    return '$';
  if (/EUR/i.test(str))    return '€';
  if (/GBP/i.test(str))    return '£';
  if (/JPY/i.test(str))    return '¥';

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
// Scrape a product page and return { title, price, currency, image }.
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
    '#productTitle',
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
    '.a-price .a-offscreen',
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

  const currency = extractCurrency(priceRaw);
  const price    = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || 0;

  // --- Image ---
  const imageSelectors = [
    '#landingImage',
    '#imgBlkFront',
    '.product-image img',
    '[data-testid="product-image"] img',
    'img.primary-image',
    'img[itemprop="image"]',
    '.gallery-image',
  ];
  let image = '';
  for (const sel of imageSelectors) {
    const el  = $(sel).first();
    const src =
      el.attr('data-old-hires') ||
      el.attr('data-src')       ||
      el.attr('src')            ||
      '';
    if (src && src.startsWith('http')) { image = src; break; }
  }

  if (!image) {
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
        image = src;
        return false;
      }
    });
  }

  return { title: title || 'Unknown Product', price, currency, image };
};

module.exports = { scrapeProductData };
