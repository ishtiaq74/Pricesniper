const axios   = require('axios');
const cheerio = require('cheerio');

// ---------------------------------------------------------------------------
// Rotating User-Agent pool — Amazon checks for stale/repeated UAs
// ---------------------------------------------------------------------------
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
];

const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// Small random delay to avoid looking like a bot
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = () => sleep(800 + Math.random() * 1200); // 0.8 – 2 sec

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
// Fetch HTML with full browser-like headers + retry on failure
// ---------------------------------------------------------------------------
const fetchHtml = async (url, attempt = 1) => {
  const ua = randomUA();

  // Determine referer / accept-language based on domain
  const isAmazon = url.includes('amazon.');

  try {
    const { data } = await axios.get(url, {
      timeout: 20000,
      maxRedirects: 5,
      headers: {
        'User-Agent':                ua,
        'Accept':                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language':           'en-US,en;q=0.9',
        'Accept-Encoding':           'gzip, deflate, br',
        'Cache-Control':             'no-cache',
        'Pragma':                    'no-cache',
        'Sec-Ch-Ua':                 '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile':          '?0',
        'Sec-Ch-Ua-Platform':        '"Windows"',
        'Sec-Fetch-Dest':            'document',
        'Sec-Fetch-Mode':            'navigate',
        'Sec-Fetch-Site':            isAmazon ? 'none' : 'same-origin',
        'Sec-Fetch-User':            '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer':                   isAmazon ? 'https://www.amazon.com/' : url,
        'Connection':                'keep-alive',
        'DNT':                       '1',
      },
    });

    // Detect Amazon bot-block (returns a page with no #productTitle)
    if (isAmazon && data.includes('api-services-support@amazon.com')) {
      throw new Error('Amazon bot-detection page received');
    }

    return data;
  } catch (err) {
    if (attempt < 3) {
      console.warn(`[scraperService] Attempt ${attempt} failed for ${url} — retrying… (${err.message})`);
      await randomDelay();
      return fetchHtml(url, attempt + 1);
    }
    throw new Error(`Failed to fetch ${url} after 3 attempts: ${err.message}`);
  }
};

// ---------------------------------------------------------------------------
// Scrape a product page and return { title, price, currency, image }.
// ---------------------------------------------------------------------------
const scrapeProductData = async (url) => {
  await randomDelay(); // polite delay before every scrape

  const html = await fetchHtml(url);
  const $    = cheerio.load(html);

  // ── Title ──────────────────────────────────────────────────────────────────
  const titleSelectors = [
    '#productTitle',                        // Amazon main
    '#title',                               // Amazon alternate
    'span#productTitle',
    'h1#title span',
    '.product-title-word-break',
    '[data-testid="product-title"]',
    'h1.product_title',                     // WooCommerce
    '.product-name h1',
    'h1.title',
    'h1',
  ];
  let title = '';
  for (const sel of titleSelectors) {
    const text = $(sel).first().text().trim();
    if (text && text.length > 3) { title = text; break; }
  }

  // ── Price ──────────────────────────────────────────────────────────────────
  // Amazon stores price split across .a-price-whole + .a-price-fraction
  let priceRaw = '';

  // Strategy 1: .a-offscreen (hidden accessible text, most reliable for Amazon)
  const offscreen = $('.a-price .a-offscreen').first().text().trim();
  if (offscreen) {
    priceRaw = offscreen;
  }

  // Strategy 2: reconstruct from whole + fraction parts
  if (!priceRaw) {
    const whole    = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
    const fraction = $('.a-price-fraction').first().text().replace(/[^0-9]/g, '');
    if (whole) priceRaw = fraction ? `${whole}.${fraction}` : whole;
  }

  // Strategy 3: fallback selector list
  if (!priceRaw) {
    const fallbackSelectors = [
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '.apexPriceToPay .a-offscreen',
      '[data-testid="price"]',
      '.price',
      '.product-price',
      '[itemprop="price"]',
      '.offer-price',
      '.woocommerce-Price-amount',
      '.a-color-price',
    ];
    for (const sel of fallbackSelectors) {
      const el        = $(sel).first();
      const attrPrice = el.attr('content') || el.attr('data-price');
      const textPrice = el.text().trim();
      if (attrPrice) { priceRaw = attrPrice; break; }
      if (textPrice) { priceRaw = textPrice; break; }
    }
  }

  // Strategy 4: JSON-LD structured data (works on many e-commerce sites)
  if (!priceRaw) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html());
        const offers = json?.offers || json?.Offers;
        if (offers?.price) { priceRaw = String(offers.price); return false; }
        if (Array.isArray(offers) && offers[0]?.price) {
          priceRaw = String(offers[0].price);
          return false;
        }
      } catch (_e) { /* ignore parse errors */ }
    });
  }

  const currency = extractCurrency(priceRaw);
  const price    = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || 0;

  // ── Image ──────────────────────────────────────────────────────────────────
  const imageSelectors = [
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    '.a-dynamic-image',
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
      el.attr('data-a-dynamic-image')?.match(/https?:\/\/[^"]+/)?.[0] ||
      el.attr('data-src')       ||
      el.attr('src')            ||
      '';
    if (src && src.startsWith('http')) { image = src; break; }
  }

  // Fallback: first non-logo <img>
  if (!image) {
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (
        src.startsWith('http') &&
        !src.includes('logo')  &&
        !src.includes('icon')  &&
        !src.includes('sprite') &&
        !src.includes('pixel')
      ) {
        image = src;
        return false; // break
      }
    });
  }

  console.log(`[scraperService] title="${title || 'NOT FOUND'}" price=${price} currency=${currency} url=${url}`);

  if (!title && price === 0) {
    throw new Error('Could not extract product data — Amazon may be blocking this request. Try again in a moment.');
  }

  return { title: title || 'Unknown Product', price, currency, image };
};

module.exports = { scrapeProductData };
