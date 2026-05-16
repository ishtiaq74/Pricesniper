/**
 * triggerAlert.js — Force-fires the price alert check immediately.
 * Bypasses the 24-hour cooldown so you can test right now.
 * Run with: node scripts/triggerAlert.js
 */
require('../config/env');
const mongoose = require('mongoose');
require('../models/User');
const Product            = require('../models/Product');
const { sendPriceAlert } = require('../services/emailService');
const { connectDatabase } = require('../config/database');

connectDatabase().then(async () => {
  console.log('\n🔍 Checking all products for alert condition (currentPrice <= targetPrice)…\n');

  const alertProducts = await Product.find({
    targetPrice:  { $gt: 0 },
    currentPrice: { $gt: 0 },
    $expr: { $lte: ['$currentPrice', '$targetPrice'] },
  }).populate('userId', 'email name');

  if (alertProducts.length === 0) {
    console.log('⚠️  No products are at or below their target price. Set a target price higher than current price to trigger an alert.');
    return mongoose.disconnect();
  }

  console.log(`✅ Found ${alertProducts.length} product(s) that meet the alert condition:\n`);

  for (const product of alertProducts) {
    const email = product.userId?.email;
    if (!email) {
      console.warn(`  ⚠️  Skipping "${product.title?.slice(0,40)}" — no user email.`);
      continue;
    }

    console.log(`  📧 Sending alert to ${email} for: "${product.title?.slice(0,50)}"`);
    console.log(`     Current: ${product.currency}${product.currentPrice}  |  Target: ${product.currency}${product.targetPrice}`);

    try {
      await sendPriceAlert(email, product);
      console.log(`  ✅ Email sent!\n`);
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}\n`);
    }
  }

  console.log('🎉 Done. Check your inbox!');
  mongoose.disconnect();
});
