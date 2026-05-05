import React, { useState } from 'react';
import axios from 'axios';
import PriceChart from './PriceChart';

/**
 * ProductCard
 * Displays a tracked product with:
 *  - Scraped image, title, and URL
 *  - Current vs Initial price comparison
 *  - Target price alert badge (green = below target, red = above)
 *  - Manual refresh button
 *  - Price history line chart
 *  - Delete button
 *
 * Props:
 *  - product        : Product object from MongoDB
 *  - onRefresh      : (updatedProduct) => void
 *  - onDelete       : (productId) => void
 */
const ProductCard = ({ product, onRefresh, onDelete }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { _id, title, image, url, currentPrice, initialPrice, targetPrice, priceHistory } = product;

  // ── Price direction indicators ──────────────────────────────────────────
  const priceDiff = currentPrice - initialPrice;
  const priceDropPct =
    initialPrice > 0 ? Math.abs((priceDiff / initialPrice) * 100).toFixed(1) : 0;
  const isDropped = priceDiff < 0;
  const isRaised = priceDiff > 0;

  // ── Target price alert logic ─────────────────────────────────────────────
  const hasTarget = targetPrice !== null && targetPrice !== undefined && targetPrice > 0;
  const isBelowTarget = hasTarget && currentPrice <= targetPrice;
  const isAboveTarget = hasTarget && currentPrice > targetPrice;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data } = await axios.put(`/api/products/${_id}/refresh`);
      onRefresh(data);
    } catch (err) {
      console.error('Refresh failed:', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove this product from tracking?')) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/products/${_id}`);
      onDelete(_id);
    } catch (err) {
      console.error('Delete failed:', err.message);
      setDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      id={`product-card-${_id}`}
      className={`card flex flex-col overflow-hidden transition-all duration-300
                  hover:border-gray-700 hover:shadow-2xl hover:-translate-y-1 animate-fade-in
                  ${isBelowTarget ? 'ring-1 ring-emerald-500/40' : ''}
                  ${isAboveTarget ? 'ring-1 ring-rose-500/30' : ''}`}
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-800 overflow-hidden">
        {image && !imgError ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain p-4 transition-transform duration-300 hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20
                14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Target Price Alert Badge */}
        {hasTarget && (
          <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold
                          flex items-center gap-1 backdrop-blur-sm
                          ${isBelowTarget
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-rose-500/90 text-white'
                          }`}>
            {isBelowTarget ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                    d="M5 13l4 4L19 7" />
                </svg>
                Target Hit!
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                    d="M12 9v2m0 4h.01" />
                </svg>
                ${targetPrice?.toFixed(2)} target
              </>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title */}
        <div>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 mb-1">{title}</h3>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-brand-500 transition-colors truncate block"
          >
            {url.length > 50 ? url.slice(0, 50) + '…' : url}
          </a>
        </div>

        {/* Prices */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Current Price</p>
            <p className="price-tag">
              {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">Initial</p>
            <p className="text-sm text-gray-400 line-through">
              {initialPrice > 0 ? `$${initialPrice.toFixed(2)}` : '—'}
            </p>
          </div>
        </div>

        {/* Price change badge */}
        {priceDiff !== 0 && (
          <div>
            {isDropped ? (
              <span className="badge-down">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
                {priceDropPct}% drop — saved ${Math.abs(priceDiff).toFixed(2)}
              </span>
            ) : (
              <span className="badge-up">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                </svg>
                {priceDropPct}% increase
              </span>
            )}
          </div>
        )}

        {/* Price Chart */}
        <PriceChart history={priceHistory} />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 mt-auto">
          <button
            id={`refresh-btn-${_id}`}
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-2 text-sm"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0
                0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh Price'}
          </button>

          <button
            id={`delete-btn-${_id}`}
            onClick={handleDelete}
            disabled={deleting}
            className="btn-ghost p-2.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
