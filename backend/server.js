require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const productRoutes = require('./routes/productRoutes');
const authRoutes    = require('./routes/authRoutes');
const { startAlertScheduler } = require('./services/priceAlertService');

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'PriceSniper API is running 🎯' }));

// ---------------------------------------------------------------------------
// MongoDB Connection + Server Start
// ---------------------------------------------------------------------------
const PORT     = process.env.PORT     || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pricesniper';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      // Start background price-alert scheduler after DB is ready
      startAlertScheduler();
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
