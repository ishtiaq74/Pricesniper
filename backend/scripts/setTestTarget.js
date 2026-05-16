require('../config/env');
const mongoose = require('mongoose');
require('../models/User');
const Product = require('../models/Product');
const { connectDatabase } = require('../config/database');

connectDatabase().then(async () => {
  const product = await Product.findOneAndUpdate(
    {
      userId:       { $exists: true, $ne: null },
      currentPrice: { $gt: 0 },
      title:        /Lenovo/i
    },
    { alertSentAt: null, targetPrice: 300 },
    { new: true }
  ).populate('userId', 'email');

  if (!product) {
    console.log('❌ Product not found.');
    return mongoose.disconnect();
  }

  console.log(`\n✅ Ready for auto-alert test:`);
  console.log(`   Product     : ${product.title}`);
  console.log(`   User email  : ${product.userId?.email}`);
  console.log(`   currentPrice: ${product.currency}${product.currentPrice}`);
  console.log(`   targetPrice : ${product.currency}${product.targetPrice}`);
  console.log(`   alertSentAt : ${product.alertSentAt}`);
  console.log(`   Condition   : ${product.currentPrice <= product.targetPrice ? '✅ currentPrice ≤ targetPrice → WILL trigger' : '❌ currentPrice > targetPrice → will NOT trigger'}`);
  console.log(`\n⏳ Scheduler runs every 1 min. Watching for auto-email…`);
  mongoose.disconnect();
});
