const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDatabase = () =>
  mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ MongoDB connected');
  });

module.exports = { connectDatabase };
