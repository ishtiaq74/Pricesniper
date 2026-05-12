const Product             = require('../models/Product');
const { sendPriceAlert }  = require('./emailService');
const { scrapeProductData } = require('./scraperService');

const TWENTY_FOUR_HRS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// refreshAllProducts
// Re-scrapes live prices for every tracked product and saves to DB.
// This runs before every alert check so prices are always fresh.
// ---------------------------------------------------------------------------
const refreshAllProducts = async () => {
  const products = await Product.find({});
  console.log(`[priceAlertService] Refreshing prices for ${products.length} product(s)…`);

  const results = await Promise.allSettled(
    products.map(async (product) => {
      // Skip orphaned products (created before userId was required)
      if (!product.userId) {
        console.warn(`[priceAlertService] ⚠️  Skipping product ${product._id} — no userId (orphaned record).`);
        return;
      }

      try {
        const { title, price, currency, image } = await scrapeProductData(product.url);

        product.title        = title    || product.title;
        product.image        = image    || product.image;
        product.currency     = currency || product.currency;
        product.currentPrice = price;
        product.priceHistory.push({ price, recordedAt: new Date() });

        await product.save();
        console.log(`[priceAlertService] ✅ ${product.title.slice(0, 40)}… → ${currency}${price}`);
      } catch (scrapeErr) {
        console.warn(
          `[priceAlertService] ⚠️  Could not refresh product ${product._id}: ${scrapeErr.message}`
        );
      }
    })
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed > 0) {
    console.warn(`[priceAlertService] ${failed} product(s) failed to refresh.`);
  }
};

// ---------------------------------------------------------------------------
// checkAndSendAlerts
// 1. Refreshes all product prices from the live web
// 2. Finds products where currentPrice <= targetPrice
// 3. Sends an email alert to the product owner (max once per 24 h per product)
// ---------------------------------------------------------------------------
const checkAndSendAlerts = async () => {
  try {
    console.log('\n[priceAlertService] ── Starting scheduled run ──');

    // Step 1: refresh all prices
    await refreshAllProducts();

    // Step 2: find products that now meet the alert condition
    const now = Date.now();

    const alertProducts = await Product.find({
      targetPrice:  { $gt: 0 },
      currentPrice: { $gt: 0 },
      $expr: { $lte: ['$currentPrice', '$targetPrice'] },
    }).populate('userId', 'email name');

    console.log(
      `[priceAlertService] ${alertProducts.length} product(s) at or below target price.`
    );

    // Step 3: send alerts
    for (const product of alertProducts) {
      const pid      = product._id.toString();

      // Cooldown check — use DB-persisted alertSentAt (survives restarts, unique per product)
      const lastSent = product.alertSentAt ? new Date(product.alertSentAt).getTime() : 0;
      if (now - lastSent < TWENTY_FOUR_HRS) {
        console.log(`[priceAlertService] ⏭  Skipping ${pid} — alert already sent within 24 h.`);
        continue;
      }

      if (!product.userId?.email) {
        console.warn(`[priceAlertService] ⚠️  No user email for product ${pid}, skipping.`);
        continue;
      }

      try {
        await sendPriceAlert(product.userId.email, product);
        // Persist timestamp to DB so cooldown survives server restarts
        product.alertSentAt = new Date();
        await product.save();
        console.log(`[priceAlertService] 📧 Alert sent for "${product.title.slice(0, 40)}…"`);
      } catch (emailErr) {
        console.error(
          `[priceAlertService] Failed to send email for ${pid}:`, emailErr.message
        );
      }
    }

    console.log('[priceAlertService] ── Run complete ──\n');
  } catch (err) {
    console.error('[priceAlertService] Unexpected error:', err.message);
  }
};

// ---------------------------------------------------------------------------
// startAlertScheduler
// Kicks off the recurring job. Runs once immediately on server start,
// then repeats every ALERT_INTERVAL_MS (default: 30 min).
// ---------------------------------------------------------------------------
const startAlertScheduler = () => {
  const intervalMs = parseInt(process.env.ALERT_INTERVAL_MS, 10) || 30 * 60 * 1000;
  const intervalMin = (intervalMs / 60000).toFixed(1);
  console.log(`[priceAlertService] Scheduler started — auto-scraping + checking every ${intervalMin} min(s).`);

  checkAndSendAlerts();                         // run immediately on startup
  setInterval(checkAndSendAlerts, intervalMs);  // then on interval
};

module.exports = { startAlertScheduler, checkAndSendAlerts, refreshAllProducts };
