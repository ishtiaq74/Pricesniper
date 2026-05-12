require('dotenv').config();
const mongoose = require('mongoose');
require('./models/User');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Find a user-owned product with currentPrice set but no target yet
  const product = await Product.findOneAndUpdate(
    {
      userId:       { $exists: true, $ne: null },
      currentPrice: { $gt: 0 },
      title:        /Lenovo/i        // Lenovo: cur=$227.18, already confirmed scrapeable
    },
    { alertSentAt: null, targetPrice: 300 }, // cur=$227.18 < target=$300 → will trigger
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
