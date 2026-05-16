require('../config/env');
const mongoose = require('mongoose');
require('../models/User');
const Product = require('../models/Product');
const { connectDatabase } = require('../config/database');

connectDatabase().then(async () => {
  const products = await Product.find({ userId: { $exists: true } }).populate('userId', 'email');
  console.log('\n📦 Product Alert Status:\n');
  products.forEach(p => {
    const alert = p.currentPrice > 0 && p.targetPrice > 0 && p.currentPrice <= p.targetPrice;
    console.log(`${alert ? '✅ ALERT' : '❌ no  '} | ${p.userId?.email?.slice(0,25)} | ${(p.title || 'N/A').slice(0,30).padEnd(30)} | cur=${p.currency}${p.currentPrice} | target=${p.currency}${p.targetPrice}`);
  });
  console.log('');
  mongoose.disconnect();
});
