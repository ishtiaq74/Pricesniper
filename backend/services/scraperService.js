const axios   = require('axios');
const cheerio = require('cheerio');

// ---------------------------------------------------------------------------
// Rotating User-Agent pool
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

const randomUA    = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const sleep       = (ms) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () => sleep(800 + Math.random() * 1200);

// ---------------------------------------------------------------------------
// Detect the platform from the URL
// ---------------------------------------------------------------------------
const detectPlatform = (url) => {
  if (url.includes('amazon.'))    return 'amazon';
  if (url.includes('alibaba.'))   return 'alibaba';
  if (url.includes('aliexpress.'))return 'aliexpress';
  if (url.includes('ebay.'))      return 'ebay';
  if (url.includes('walmart.'))   return 'walmart';
  if (url.includes('daraz.'))     return 'daraz';
  if (url.includes('othoba.'))    return 'othoba';
  return 'generic';
};

// ---------------------------------------------------------------------------
// Helper – extract currency symbol from a raw price string
// ---------------------------------------------------------------------------
const extractCurrency = (raw, platform, url) => {
  // Auto-detect currency by platform/domain
  if (platform === 'daraz' && url.includes('.bd'))  return '৳';
  if (platform === 'daraz' && url.includes('.pk'))  return 'Rs';
  if (platform === 'daraz' && url.includes('.lk'))  return 'Rs';
  if (!raw) return '$';
  const str = raw.toString().trim();
  if (/TK|BDT/i.test(str)) return '৳';
  if (/INR/i.test(str))    return '₹';
  if (/USD/i.test(str))    return '$';
  if (/EUR/i.test(str))    return '€';
  if (/GBP/i.test(str))    return '£';
  if (/JPY/i.test(str))    return '¥';
  if (str.includes('৳'))  return '৳';
  if (str.includes('₹'))  return '₹';
  if (str.includes('€'))  return '€';
  if (str.includes('£'))  return '£';
  if (str.includes('¥'))  return '¥';
  if (str.includes('₩'))  return '₩';
  if (str.includes('₺'))  return '₺';
  if (str.includes('₫'))  return '₫';
  if (str.includes('฿'))  return '฿';
  if (str.includes('$'))  return '$';
  return '$';
};

// ---------------------------------------------------------------------------
// Parse the first valid number out of a price string (handles ranges like
// "$5.00 - $10.00" by taking the lower bound)
// ---------------------------------------------------------------------------
const parseFirstPrice = (raw) => {
  if (!raw) return 0;
  const match = raw.toString().match(/[\d,]+\.?\d*/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, '')) || 0;
};

// ---------------------------------------------------------------------------
// Fetch HTML with full browser-like headers + retry on failure
// ---------------------------------------------------------------------------
const fetchHtml = async (url, attempt = 1) => {
  const platform = detectPlatform(url);
  const ua = randomUA();

  const refererMap = {
    amazon:    'https://www.amazon.com/',
    alibaba:   'https://www.alibaba.com/',
    aliexpress:'https://www.aliexpress.com/',
    ebay:      'https://www.ebay.com/',
    walmart:   'https://www.walmart.com/',
    daraz:     'https://www.daraz.com/',
    othoba:    'https://othoba.com/',
    generic:   url,
  };

  try {
    const { data } = await axios.get(url, {
      timeout: 25000,
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
        'Sec-Fetch-Site':            'none',
        'Sec-Fetch-User':            '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer':                   refererMap[platform],
        'Connection':                'keep-alive',
        'DNT':                       '1',
      },
    });

    // Amazon bot-block detection
    if (platform === 'amazon' && data.includes('api-services-support@amazon.com')) {
      throw new Error('Amazon bot-detection page received');
    }

    return { html: data, platform };
  } catch (err) {
    if (attempt < 3) {
      console.warn(`[scraperService] Attempt ${attempt} failed for ${url} — retrying… (${err.message})`);
      await randomDelay();
      return fetchHtml(url, attempt + 1);
    }
    throw new Error(`Failed to fetch page after 3 attempts: ${err.message}`);
  }
};

// ---------------------------------------------------------------------------
// Try to extract a value from embedded JSON in <script> tags
// Supports window.__GLOBAL_DATA__, window.runParams, etc.
// ---------------------------------------------------------------------------
const extractFromInlineScript = ($, keys) => {
  let result = null;
  $('script').each((_, el) => {
    const text = $(el).html() || '';
    for (const key of keys) {
      const re = new RegExp(`["']?${key}["']?\\s*:\\s*["']?([\\d.,\\-]+)["']?`);
      const m  = text.match(re);
      if (m && m[1]) { result = m[1]; return false; }
    }
  });
  return result;
};

// ---------------------------------------------------------------------------
// Main scraper function
// ---------------------------------------------------------------------------
const scrapeProductData = async (rawUrl) => {
  await randomDelay();

  // ── URL sanitisation ────────────────────────────────────────────────────────
  // eBay /itm/ listings include long tracking params (itmprp, itmmeta, hash)
  // that trigger eBay's 403 bot-detection. Strip everything after the item ID.
  let url = rawUrl;
  if (url.includes('ebay.') && /\/itm\/\d+/.test(url)) {
    const itemId = url.match(/\/itm\/(\d+)/)?.[1];
    if (itemId) {
      // Keep only the host + /itm/{id}  (e.g. ebay.com/itm/375557451028)
      const host = url.match(/https?:\/\/[^/]+/)?.[0] || 'https://www.ebay.com';
      url = `${host}/itm/${itemId}`;
      console.log(`[scraperService] eBay URL cleaned: ${url}`);
    }
  }

  // ── Fetch HTML ───────────────────────────────────────────────────────────────
  let html, platform;

  // eBay /itm/ pages — eBay blocks all HTML scraping on /itm/ listings.
  // Use the free eBay Shopping API (GetSingleItem) first; fall back to HTML scraping.
  if (url.includes('ebay.') && /\/itm\/\d+/.test(url)) {
    const itemId   = url.match(/\/itm\/(\d+)/)?.[1];
    const ebayAppId = process.env.EBAY_APP_ID;

    if (ebayAppId && ebayAppId !== 'your_ebay_app_id_here') {
      // ── eBay Shopping API ────────────────────────────────────────────────────
      // Free, no OAuth needed. Get a key at https://developer.ebay.com
      try {
        console.log(`[scraperService] eBay Shopping API → itemId=${itemId}`);
        const { data } = await axios.get('https://open.api.ebay.com/shopping', {
          params: {
            callname:         'GetSingleItem',
            responseencoding: 'JSON',
            appid:            ebayAppId,
            siteid:           '0',
            version:          '967',
            ItemID:           itemId,
            IncludeSelector:  'Details,ItemSpecifics',
          },
          timeout: 15000,
        });

        const item = data?.Item;
        if (item) {
          const apiTitle    = item.Title         || '';
          const apiPrice    = item.ConvertedCurrentPrice?.Value
                           || item.CurrentPrice?.Value
                           || 0;
          const apiCurrency = item.ConvertedCurrentPrice?.CurrencyID === 'USD' ? '$'
                           : (item.CurrentPrice?.CurrencyID || '$');
          const apiImage    = item.PictureURL?.[0] || item.GalleryURL || '';

          console.log(`[scraperService] eBay API success: "${apiTitle}" ${apiCurrency}${apiPrice}`);
          return {
            title:    apiTitle || 'Unknown Product',
            price:    parseFloat(apiPrice) || 0,
            currency: apiCurrency,
            image:    apiImage,
          };
        }
      } catch (apiErr) {
        console.warn(`[scraperService] eBay API failed: ${apiErr.message} — falling back to HTML`);
      }
    }

    // ── HTML fallback for /itm/ (best-effort, likely blocked) ────────────────
    let lastErr;
    for (const variant of [url, `https://m.ebay.com/itm/${itemId}`]) {
      try {
        console.log(`[scraperService] eBay HTML fallback: ${variant}`);
        const result = await fetchHtml(variant);
        html     = result.html;
        platform = result.platform;
        break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!html) {
      throw new Error(
        'eBay blocked this listing page. ' +
        'Add EBAY_APP_ID to your .env (free key at developer.ebay.com) for reliable eBay scraping, ' +
        'or use the catalog page URL (ebay.com/p/...) instead of an individual listing (ebay.com/itm/...).'
      );
    }
  } else {
    const result = await fetchHtml(url);
    html     = result.html;
    platform = result.platform;
  }

  const $ = cheerio.load(html);

  // ── Title ─────────────────────────────────────────────────────────────────
  const titleSelectors = {
    amazon: [
      '#productTitle', '#title', 'span#productTitle',
      'h1#title span', '.product-title-word-break',
    ],
    alibaba: [
      'h1.title-text', 'h1[class*="title"]', '.product-title h1',
      '.detail-title h1', '.module-pdp-title h1', 'h1',
    ],
    aliexpress: [
      'h1.product-title-text', '.product-title', 'h1',
    ],
    ebay: [
      'h1.x-item-title__mainTitle', '#itemTitle', 'h1',
    ],
    walmart: [
      'h1.lh-copy', '[itemprop="name"]', 'h1',
    ],
    generic: [
      '[data-testid="product-title"]', 'h1.product_title',
      '.product-name h1', 'h1.title', 'h1',
    ],
  };

  const allTitleSelectors = [
    ...(titleSelectors[platform] || []),
    ...titleSelectors.generic,
  ];

  let title = '';
  for (const sel of allTitleSelectors) {
    const text = $(sel).first().text().trim();
    if (text && text.length > 3) { title = text; break; }
  }

  // Fallback: Open Graph title
  if (!title) {
    title = $('meta[property="og:title"]').attr('content')?.trim() || '';
  }
  // Fallback: <title> tag (strip site name)
  if (!title) {
    title = $('title').first().text().split(/[|\-–—]/)[0].trim();
  }

  // ── Price ─────────────────────────────────────────────────────────────────
  let priceRaw = '';

  // Strategy 1: Open Graph price meta tags (works on many e-commerce sites)
  priceRaw = $('meta[property="product:price:amount"]').attr('content') ||
             $('meta[property="og:price:amount"]').attr('content')      ||
             $('meta[name="twitter:data1"]').attr('content')            || '';
  // Only use OG price if it looks like a real number
  if (priceRaw && !/[\d]/.test(priceRaw)) priceRaw = '';

  // Strategy 2 (Daraz): Extract price from URL clickTrackInfo parameter
  // Daraz flash-sale links embed the price directly in the URL query string.
  // Use raw regex instead of new URL() — Daraz URLs contain nested '?' which
  // can trip up the standard URL parser.
  if (!priceRaw && platform === 'daraz') {
    const clickMatch = url.match(/[?&]clickTrackInfo=([^&\s]+)/);
    if (clickMatch) {
      try {
        const decoded = decodeURIComponent(clickMatch[1]);
        // prefer flash-sale discounted price; fall back to regular price
        const discountMatch = decoded.match(/fs_item_discount_price[:\s]+([\d.]+)/);
        const regularMatch  = decoded.match(/fs_item_price[:\s]+([\d.]+)/);
        if (discountMatch)      { priceRaw = discountMatch[1]; console.log(`[scraperService][daraz] clickTrackInfo discount price: ${priceRaw}`); }
        else if (regularMatch) { priceRaw = regularMatch[1];  console.log(`[scraperService][daraz] clickTrackInfo regular price: ${priceRaw}`); }
      } catch (_) { /* decode error — skip */ }
    }

    // Daraz static HTML selectors (work on non-JS-cached pages)
    if (!priceRaw) {
      const darazSelectors = [
        '.pdp-product-price',
        '[class*="pdp-price"]',
        '[data-spm="pdp_product_price"]',
        '.price-box .price',
        '.notranslate',
        '[class*="price"]',
      ];
      for (const sel of darazSelectors) {
        const el   = $(sel).first();
        const text = el.text().trim();
        if (text && /[\d]/.test(text)) { priceRaw = text; break; }
      }
    }

    // Daraz embeds all product data in window.__NEXT_DATA__ (Next.js)
    if (!priceRaw) {
      $('script').each((_, el) => {
        const text = $(el).html() || '';
        if (text.includes('sellPrice') || text.includes('originalPrice') || text.includes('__NEXT_DATA__')) {
          const m = text.match(/["']?(?:sellPrice|salePrice|currentPrice|discountedPrice|priceLocal)["']?\s*:\s*([\d.]+)/);
          if (m) { priceRaw = m[1]; return false; }
        }
      });
    }
  }

  // Strategy 2: Amazon-specific (most reliable selectors first)
  if (!priceRaw && platform === 'amazon') {
    // apexPriceToPay is Amazon's primary buy-box price widget
    priceRaw = $('.apexPriceToPay .a-offscreen').first().text().trim();

    // Explicitly target the "base" (non-strikethrough) price
    if (!priceRaw) {
      priceRaw = $('.a-price[data-a-color="base"] .a-offscreen').first().text().trim();
    }

    // Reconstruct from split whole + fraction parts
    if (!priceRaw) {
      // Amazon renders: <span class="a-price-whole">19.<span class="a-price-decimal">.</span></span>
      // We clone to remove the inner decimal span before reading text
      const wholeEl = $('.apexPriceToPay .a-price-whole, .a-price[data-a-color="base"] .a-price-whole').first();
      const whole   = wholeEl.clone().children().remove().end().text().replace(/[^0-9]/g, '');
      const fraction = $('.apexPriceToPay .a-price-fraction, .a-price[data-a-color="base"] .a-price-fraction').first().text().replace(/[^0-9]/g, '');
      if (whole) priceRaw = fraction ? `${whole}.${fraction}` : `${whole}.00`;
    }

    // Last Amazon fallback: any .a-offscreen that contains a currency symbol
    if (!priceRaw) {
      $('.a-offscreen').each((_, el) => {
        const t = $(el).text().trim();
        if (/[$£€₹₩৳¥]/.test(t) && /\d/.test(t)) { priceRaw = t; return false; }
      });
    }

    // Old-style price blocks (still present on some pages)
    if (!priceRaw) {
      priceRaw = $('#priceblock_ourprice').text().trim() ||
                 $('#priceblock_dealprice').text().trim() || '';
    }
  }

  // Strategy 3: Platform-specific selectors (non-Amazon)
  if (!priceRaw) {
    const priceSelectors = {
      alibaba: [
        '.price-original',
        '.module-pdp-price .price',
        '[class*="price-range"]',
        '[class*="price"]',
        '.price',
      ],
      aliexpress: [
        '.product-price-value',
        '.uniform-banner-box-price',
        '[class*="price--"]',
        '.price',
      ],
      ebay: [
        '.x-price-primary .ux-textspans',
        '#prcIsum',
        '.mainPrice .display-price',
        '[itemprop="price"]',
      ],
      walmart: [
        '[itemprop="price"]',
        '.price-characteristic',
        '[class*="price-current"]',
      ],
      generic: [
        '[data-testid="price"]',
        '.price',
        '.product-price',
        '[itemprop="price"]',
        '.offer-price',
        '.woocommerce-Price-amount',
      ],
    };

    const selList = [
      ...(priceSelectors[platform] || []),
      ...priceSelectors.generic,
    ];

    for (const sel of selList) {
      const el        = $(sel).first();
      const attrPrice = el.attr('content') || el.attr('data-price');
      const textPrice = el.text().trim();
      if (attrPrice && /\d/.test(attrPrice)) { priceRaw = attrPrice; break; }
      if (textPrice && /\d/.test(textPrice)) { priceRaw = textPrice; break; }
    }
  }

  // Strategy 4: JSON-LD structured data
  if (!priceRaw) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json   = JSON.parse($(el).html());
        const offers = json?.offers || json?.Offers;
        if (offers?.price)          { priceRaw = String(offers.price);     return false; }
        if (offers?.lowPrice)       { priceRaw = String(offers.lowPrice);  return false; }
        if (Array.isArray(offers) && offers[0]?.price) {
          priceRaw = String(offers[0].price); return false;
        }
      } catch (_e) { /* ignore */ }
    });
  }

  // Strategy 5: Inline JS variable extraction (last resort for Alibaba etc.)
  if (!priceRaw) {
    priceRaw = extractFromInlineScript($, [
      'price', 'priceValue', 'salePrice', 'currentPrice',
      'minPrice', 'originalPrice', 'promotionPrice',
    ]) || '';
  }

  const currency = extractCurrency(priceRaw, platform, url);
  const price    = parseFirstPrice(priceRaw);

  // ── Image ─────────────────────────────────────────────────────────────────
  const imageSelectors = [
    // Open Graph (universal)
    // handled separately below
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    '.a-dynamic-image',
    // Alibaba
    '.detail-gallery-img img',
    '.module-gallery img',
    '[class*="gallery"] img',
    // Generic
    '.product-image img',
    '[data-testid="product-image"] img',
    'img.primary-image',
    'img[itemprop="image"]',
    '.gallery-image',
  ];

  // Open Graph image first (most reliable)
  let image = $('meta[property="og:image"]').attr('content') || '';

  if (!image) {
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
  }

  // Last resort: first non-icon <img>
  if (!image) {
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (
        src.startsWith('http') &&
        !src.includes('logo')  &&
        !src.includes('icon')  &&
        !src.includes('sprite') &&
        !src.includes('pixel') &&
        !src.includes('blank')
      ) { image = src; return false; }
    });
  }

  console.log(`[scraperService] platform=${platform} title="${title || 'NOT FOUND'}" price=${price} currency=${currency} url=${url}`);

  if (!title && price === 0) {
    const platformName = platform === 'generic' ? 'this website' : platform.charAt(0).toUpperCase() + platform.slice(1);
    throw new Error(
      `Could not extract product data from ${platformName}. ` +
      (platform === 'alibaba' || platform === 'aliexpress'
        ? 'Alibaba/AliExpress load prices dynamically via JavaScript — try using the product\'s direct detail page URL.'
        : 'The page may be blocking automated requests. Try again in a moment.')
    );
  }

  return { title: title || 'Unknown Product', price, currency, image };
};

module.exports = { scrapeProductData };
