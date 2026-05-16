const axios = require('axios');
const { EXCHANGERATE_API_KEY } = require('../config/env');

/**
 * currencyService
 * Fetches live USD-based exchange rates from ExchangeRate-API and caches them
 * in memory for 1 hour so we stay within the free tier (1,500 req/month).
 *
 * Required .env variable:
 *   EXCHANGERATE_API_KEY — get a free key at https://www.exchangerate-api.com
 */

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedRates     = null;
let cacheTimestamp  = 0;

/**
 * getRates()
 * Returns an object like { USD: 1, BDT: 110.5, INR: 83.2, EUR: 0.92, GBP: 0.79, ... }
 * Refreshes only when the cache is older than 1 hour.
 */
const getRates = async () => {
  const now = Date.now();

  // Return cached rates if still fresh
  if (cachedRates && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedRates;
  }

  const apiKey = EXCHANGERATE_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    console.warn('[currencyService] EXCHANGERATE_API_KEY not set — returning fallback rates.');
    // Return sensible fallback rates so the UI doesn't break without a key
    return {
      USD: 1,
      BDT: 110,
      INR: 83,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 154,
      CAD: 1.37,
      AUD: 1.53,
    };
  }

  try {
    const { data } = await axios.get(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
      { timeout: 10000 }
    );

    if (data.result !== 'success') {
      throw new Error(`ExchangeRate-API error: ${data['error-type'] || 'unknown'}`);
    }

    cachedRates    = data.conversion_rates; // e.g. { USD: 1, BDT: 110.5, ... }
    cacheTimestamp = now;

    console.log(`[currencyService] Rates refreshed — ${Object.keys(cachedRates).length} currencies cached.`);
    return cachedRates;
  } catch (err) {
    console.error('[currencyService] Failed to fetch rates:', err.message);

    // If we have stale cache, return it rather than crashing
    if (cachedRates) {
      console.warn('[currencyService] Returning stale cached rates as fallback.');
      return cachedRates;
    }

    // Last resort: hardcoded fallback
    return { USD: 1, BDT: 110, INR: 83, EUR: 0.92, GBP: 0.79 };
  }
};

module.exports = { getRates };
