require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/pricesniper',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL,
  EXCHANGERATE_API_KEY: process.env.EXCHANGERATE_API_KEY,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  ALERT_INTERVAL_MS: process.env.ALERT_INTERVAL_MS,
  EBAY_APP_ID: process.env.EBAY_APP_ID,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GOOGLE_CX_ID: process.env.GOOGLE_CX_ID,
};
