require('../config/env');
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const { connectDatabase } = require('../config/database');

connectDatabase().then(async () => {
  const result = await Product.updateMany({}, { $set: { alertSentAt: null } });
  console.log(`✅ Cleared alertSentAt on ALL ${result.modifiedCount} product(s).`);

  const eligible = await Product.find({
    targetPrice:  { $gt: 0 },
    currentPrice: { $gt: 0 },
    $expr: { $lte: ['$currentPrice', '$targetPrice'] },
  });
  console.log(`\n🔍 Products eligible for alert (currentPrice ≤ targetPrice):`);
  eligible.forEach(p => {
    console.log(`  → [${p._id}] ${p.title?.slice(0,40)} | cur=${p.currency}${p.currentPrice} | target=${p.currency}${p.targetPrice} | alertSentAt=${p.alertSentAt}`);
  });
  if (eligible.length === 0) console.log('  (none — target price may be lower than current price)');
  mongoose.disconnect();
});
