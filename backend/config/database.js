const dns = require('dns');
const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

// Force reliable DNS servers so MongoDB SRV lookup works on all networks
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDatabase = () =>
  mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ MongoDB connected');
  });

module.exports = { connectDatabase };
