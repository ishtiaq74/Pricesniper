require('./config/env');
const express = require('express');
const cors = require('cors');
const { PORT, FRONTEND_URL } = require('./config/env');
const { connectDatabase } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

const productRoutes = require('./routes/productRoutes');
const authRoutes    = require('./routes/authRoutes');
const { startAlertScheduler } = require('./services/priceAlertService');

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:3000',
  FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);

app.get('/', (req, res) => res.json({ message: 'PriceSniper API is running 🎯' }));

app.use(errorHandler);

// ---------------------------------------------------------------------------
// MongoDB Connection + Server Start
// ---------------------------------------------------------------------------
connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      startAlertScheduler();
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
