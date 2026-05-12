const axios = require('axios');

/**
 * searchService
 * Queries the Google Custom Search JSON API to find price comparison results
 * for a given product title.
 *
 * Required .env variables:
 *   GOOGLE_API_KEY — https://console.cloud.google.com (enable Custom Search API)
 *   GOOGLE_CX_ID   — https://programmablesearchengine.google.com (your Search Engine ID)
 */

/**
 * searchProduct(title)
 * @param {string} title - product title to search for
 * @returns {Array} up to 5 results: [{ title, link, snippet, displayLink }]
 *                  Returns [] on any error — never throws.
 */
const searchProduct = async (title) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx     = process.env.GOOGLE_CX_ID;

  if (!apiKey || apiKey === 'your_key_here' || !cx || cx === 'your_cx_id_here') {
    console.warn('[searchService] GOOGLE_API_KEY or GOOGLE_CX_ID not configured — returning empty results.');
    return [];
  }

  if (!title || !title.trim()) return [];

  try {
    const query = `${title.trim()} buy price`;
    const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx,
        q:   encodeURIComponent(query),
        num: 5, // max results
      },
      timeout: 10000,
    });

    const items = data.items || [];
    return items.slice(0, 5).map((item) => ({
      title:       item.title       || '',
      link:        item.link        || '',
      snippet:     item.snippet     || '',
      displayLink: item.displayLink || '',
    }));
  } catch (err) {
    console.error('[searchService] Google Custom Search failed:', err.message);
    return []; // never crash the caller
  }
};

module.exports = { searchProduct };
