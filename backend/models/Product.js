const mongoose = require('mongoose');

/**
 * PriceEntry sub-document — stores a price snapshot with a timestamp.
 * Appended to priceHistory[] on every scrape/refresh.
 */
const priceEntrySchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Product schema — the core model for PriceSniper.
 *
 * Fields:
 *  - url          : The product page URL to scrape.
 *  - title        : Scraped product title.
 *  - image        : Scraped product image URL.
 *  - currentPrice : Latest scraped price (numeric).
 *  - initialPrice : Price recorded on first add (never updated).
 *  - targetPrice  : User-defined alert threshold.
 *  - priceHistory : Array of { price, recordedAt } snapshots.
 */
const productSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Product URL is required'],
      trim: true,
    },
    title: {
      type: String,
      default: 'Unknown Product',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    currentPrice: {
      type: Number,
      default: 0,
    },
    initialPrice: {
      type: Number,
      default: 0,
    },
    targetPrice: {
      type: Number,
      default: null,
    },
    priceHistory: {
      type: [priceEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('Product', productSchema);
