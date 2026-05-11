import React, { useState } from 'react';
import axios from 'axios';
import PriceChart from './PriceChart';

/**
 * ProductCard
 * Redesigned for the new light-theme UI.
 * - Colored % drop badge top-left (green)
 * - "All-time low" badge top-right (green) when isBelowTarget
 * - Current price large bold orange, initial price struck through
 * - Green savings pill
 * - Orange progress bar (current → target)
 * - Expandable "Price History" section
 *
 * All API logic (refresh, delete) unchanged.
 */
const ProductCard = ({ product, onRefresh, onDelete }) => {
  const [refreshing, setRefreshing]     = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [imgError, setImgError]         = useState(false);
  const [historyOpen, setHistoryOpen]   = useState(false);

  const {
    _id, title, image, url,
    currentPrice, initialPrice, targetPrice,
    priceHistory, currency,
  } = product;

  const sym = currency || '$';

  const priceDiff    = currentPrice - initialPrice;
  const priceDropPct = initialPrice > 0
    ? Math.abs((priceDiff / initialPrice) * 100).toFixed(1)
    : 0;
  const isDropped    = priceDiff < 0;

  const hasTarget     = targetPrice !== null && targetPrice !== undefined && targetPrice > 0;
  const isBelowTarget = hasTarget && currentPrice <= targetPrice;
  const isAboveTarget = hasTarget && currentPrice > targetPrice;

  // Progress bar: how close is currentPrice to targetPrice?
  // 100% = at or below target, 0% = at initialPrice
  const progressPct = hasTarget && initialPrice > targetPrice
    ? Math.min(
        100,
        Math.max(0, ((initialPrice - currentPrice) / (initialPrice - targetPrice)) * 100)
      ).toFixed(0)
    : 0;

  /* ── API Handlers ── */
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

  return (
    <div
      id={`product-card-${_id}`}
      className={`bg-white border rounded-2xl shadow-sm overflow-hidden
                  flex flex-col transition-all duration-300 animate-fade-in
                  hover:shadow-md hover:-translate-y-0.5
                  ${isBelowTarget ? 'border-[#F97316]/40' : 'border-gray-200'}
                  ${isAboveTarget ? 'border-red-200' : ''}`}
    >
      {/* ── Thumbnail ── */}
      <div className="relative h-48 bg-gray-50 overflow-hidden">
        {image && !imgError ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain p-4 transition-transform duration-300 hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-14 h-14 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828
                   0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* % drop badge — top left (green) */}
        {isDropped && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white
                          text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            {priceDropPct}% drop
          </div>
        )}

        {/* All-time low badge — top right (green) */}
        {isBelowTarget && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white
                          text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            All-time low
          </div>
        )}

        {/* Above-target badge */}
        {isAboveTarget && !isDropped && (
          <div className="absolute top-2 right-2 bg-red-400 text-white
                          text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {sym}{targetPrice?.toFixed(2)} target
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
          {title}
        </h3>

        {/* URL */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-[#F97316] transition-colors truncate block"
        >
          {url.length > 50 ? url.slice(0, 50) + '…' : url}
        </a>

        {/* Prices */}
        <div className="flex items-end gap-2 mt-0.5">
          <p className="text-2xl font-bold text-[#F97316]">
            {currentPrice > 0 ? `${sym}${currentPrice.toFixed(2)}` : 'N/A'}
          </p>
          {initialPrice > 0 && (
            <p className="text-sm text-gray-400 line-through mb-0.5">
              {sym}{initialPrice.toFixed(2)}
            </p>
          )}
          {initialPrice > 0 && (
            <p className="text-xs text-gray-400 mb-0.5">Initial</p>
          )}
        </div>

        {/* Savings pill */}
        {isDropped && (
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200
                          text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full w-fit">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            {priceDropPct}% drop — saved {sym}{Math.abs(priceDiff).toFixed(2)}
          </div>
        )}

        {/* Price-to-target progress bar */}
        {hasTarget && (
          <div className="mt-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Target: {sym}{targetPrice?.toFixed(2)}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F97316] rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center gap-2 pt-1 mt-auto">
          <button
            id={`refresh-btn-${_id}`}
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-2 text-sm"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0
                   0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            id={`delete-btn-${_id}`}
            onClick={handleDelete}
            disabled={deleting}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-400
                       hover:text-red-500 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                   7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* ── Expandable Price History ── */}
        <button
          id={`history-toggle-${_id}`}
          onClick={() => setHistoryOpen((o) => !o)}
          className="flex items-center justify-between w-full text-xs text-gray-400
                     hover:text-[#F97316] transition-colors pt-1 border-t border-gray-100 mt-1"
        >
          <span className="font-medium">Price history</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${historyOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {historyOpen && (
          <div className="animate-fade-in">
            <PriceChart history={priceHistory} currency={sym} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
