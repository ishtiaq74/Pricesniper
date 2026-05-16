const axios = require('axios');
const { GOOGLE_API_KEY, GOOGLE_CX_ID } = require('../config/env');

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
  const apiKey = GOOGLE_API_KEY;
  const cx     = GOOGLE_CX_ID;

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
        q:   query,   // axios params auto-encodes — do NOT wrap in encodeURIComponent
        num: 5,
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
    // Log the actual Google error body so the developer can act on it
    const googleMsg = err.response?.data?.error?.message || err.message;
    const googleStatus = err.response?.status || 'network error';
    console.error(`[searchService] Google Custom Search failed [${googleStatus}]: ${googleMsg}`);

    if (err.response?.status === 403) {
      console.error('[searchService] 403 Fix → Go to https://console.cloud.google.com/apis/library/customsearch.googleapis.com and ENABLE the Custom Search API for your project, then ensure your API key has no restrictions blocking it.');
    }
    return [];
  }
};

module.exports = { searchProduct };
