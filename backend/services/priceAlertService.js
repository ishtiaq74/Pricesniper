const Product = require('../models/Product');
const { sendPriceAlert } = require('./emailService');

// Tracks the last alert time per product to avoid spam (once per 24h)
const lastAlertSent = new Map(); // productId → timestamp

/**
 * checkAndSendAlerts
 * Queries all products where currentPrice <= targetPrice,
 * then sends an email to the product owner (if not already sent today).
 */
const checkAndSendAlerts = async () => {
  try {
    console.log('[priceAlertService] Running price alert check…');

    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    // Populate userId so we have the user's email
    const products = await Product.find({
      targetPrice: { $gt: 0 },
      currentPrice: { $gt: 0 },
      $expr: { $lte: ['$currentPrice', '$targetPrice'] },
    }).populate('userId', 'email name');

    console.log(`[priceAlertService] Found ${products.length} product(s) at or below target price.`);

    for (const product of products) {
      const pid = product._id.toString();
      const lastSent = lastAlertSent.get(pid) || 0;

      // Skip if alert already sent within 24 hours
      if (now - lastSent < TWENTY_FOUR_HOURS) {
        continue;
      }

      if (!product.userId || !product.userId.email) {
        console.warn(`[priceAlertService] No user email for product ${pid}, skipping.`);
        continue;
      }

      try {
        await sendPriceAlert(product.userId.email, product);
        lastAlertSent.set(pid, now);
      } catch (emailErr) {
        console.error(`[priceAlertService] Failed to send email for ${pid}:`, emailErr.message);
      }
    }
  } catch (err) {
    console.error('[priceAlertService] checkAndSendAlerts error:', err.message);
  }
};

/**
 * startAlertScheduler
 * Starts a recurring interval that calls checkAndSendAlerts.
 * Interval defaults to 30 minutes, configurable via ALERT_INTERVAL_MS env var.
 */
const startAlertScheduler = () => {
  const intervalMs = parseInt(process.env.ALERT_INTERVAL_MS, 10) || 30 * 60 * 1000;
  console.log(`[priceAlertService] Scheduler started — checking every ${intervalMs / 60000} min(s).`);

  // Run once immediately on startup, then on interval
  checkAndSendAlerts();
  setInterval(checkAndSendAlerts, intervalMs);
};

module.exports = { startAlertScheduler, checkAndSendAlerts };
