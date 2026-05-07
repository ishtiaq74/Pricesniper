/**
 * testEmail.js — Quick standalone test for the PriceSniper email system.
 * Run with: node testEmail.js
 */
require('dotenv').config();
const { sendPriceAlert } = require('./services/emailService');

const mockProduct = {
  title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
  currentPrice: 249.99,
  targetPrice: 279.99,
  currency: '$',
  image: 'https://m.media-amazon.com/images/I/61vJFf9SFLL._AC_SL1500_.jpg',
  url: 'https://www.amazon.com/dp/B09XS7JWHH',
};

const recipientEmail = process.env.EMAIL_USER; // sends to yourself

console.log('📧 PriceSniper Email Test');
console.log('─────────────────────────');
console.log(`  Sender  : ${process.env.EMAIL_USER}`);
console.log(`  To      : ${recipientEmail}`);
console.log(`  API Key : ${process.env.BREVO_API_KEY ? '✅ Set (' + process.env.BREVO_API_KEY.slice(0, 12) + '…)' : '❌ NOT SET'}`);
console.log('─────────────────────────');
console.log('Sending test alert…\n');

sendPriceAlert(recipientEmail, mockProduct)
  .then(() => {
    console.log('\n✅ SUCCESS — Email sent! Check your inbox at:', recipientEmail);
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ FAILED — Error details:');
    if (err.response) {
      console.error('  HTTP Status :', err.response.status);
      console.error('  Brevo Error :', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('  Message     :', err.message);
    }
    process.exit(1);
  });
