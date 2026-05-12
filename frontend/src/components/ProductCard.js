import React, { useState, useMemo } from 'react';
import axios from 'axios';
import PriceChart from './PriceChart';

/**
 * ProductCard
 * Redesigned for the new light-theme UI.
 *
 * New in this version:
 *  Feature 1 — Currency Conversion
 *    - Accepts `selectedCurrency` (e.g. "BDT") and `rates` ({ USD:1, BDT:110, ... })
 *    - Displays converted price in orange bold; original scraped price struck through in gray
 *    - Conversion is display-only — stored prices in MongoDB are never modified
 *
 *  Feature 2 — Product Comparison (Google Custom Search)
 *    - "Compare Prices 🔍" button below the price history section
 *    - Results cached in component state — re-click does NOT re-fetch
 *    - Up to 5 results shown in an expandable panel (displayLink, snippet, "View →")
 */

// ── Currency helpers ──────────────────────────────────────────────────────────

/** ISO code → display symbol map for the currencies we support */
const CURRENCY_SYMBOLS = {
  USD: '$', BDT: '৳', INR: '₹', EUR: '€', GBP: '£',
  JPY: '¥', CAD: 'CA$', AUD: 'A$', KRW: '₩', TRY: '₺',
};

/**
 * Convert a price from its scraped currency to the user's selected display currency.
 * Returns { displayPrice, displaySym } — or null if rates aren't loaded yet.
 *
 * Strategy: all rates are relative to USD (from ExchangeRate-API /latest/USD).
 *   1. Map scraped currency symbol → ISO code
 *   2. Convert scraped price to USD first
 *   3. Then convert USD → selectedCurrency
 */
const SYMBOL_TO_ISO = {
  '$': 'USD', '৳': 'BDT', '₹': 'INR', '€': 'EUR',
  '£': 'GBP', '¥': 'JPY', '₩': 'KRW', '₺': 'TRY',
  'Rs': 'LKR',
};

const convertPrice = (price, scrapedSymbol, selectedCurrency, rates) => {
  if (!rates || !price || price <= 0) return null;

  const fromISO = SYMBOL_TO_ISO[scrapedSymbol] || 'USD';
  const fromRate = rates[fromISO] || 1;
  const toRate   = rates[selectedCurrency] || 1;

  // price (in fromISO) → USD → selectedCurrency
  const converted = (price / fromRate) * toRate;
  return {
    displayPrice: converted,
    displaySym:   CURRENCY_SYMBOLS[selectedCurrency] || selectedCurrency,
  };
};

// ── Component ─────────────────────────────────────────────────────────────────

const ProductCard = ({ product, onRefresh, onDelete, onTargetUpdate, selectedCurrency, rates }) => {
  const [refreshing, setRefreshing]     = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [imgError, setImgError]         = useState(false);
  const [historyOpen, setHistoryOpen]   = useState(false);

  // Inline target price editor state
  const [editingTarget, setEditingTarget] = useState(false);
  const [newTarget, setNewTarget]         = useState('');
  const [targetSaving, setTargetSaving]   = useState(false);

  // Feature 2 — Compare state
  const [compareOpen, setCompareOpen]   = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResults, setCompareResults] = useState(null); // null = not fetched yet

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

  // Progress bar
  const progressPct = hasTarget && initialPrice > targetPrice
    ? Math.min(
        100,
        Math.max(0, ((initialPrice - currentPrice) / (initialPrice - targetPrice)) * 100)
      ).toFixed(0)
    : 0;

  // ── Feature 1: Converted price ───────────────────────────────────────────
  const converted = useMemo(
    () => convertPrice(currentPrice, sym, selectedCurrency, rates),
    [currentPrice, sym, selectedCurrency, rates]
  );

  // Only show the conversion row when the display currency differs from the scraped one
  const showConversion =
    converted !== null &&
    (SYMBOL_TO_ISO[sym] || 'USD') !== selectedCurrency;

  // Converted target price (for display + pre-filling the editor)
  const convertedTarget = useMemo(
    () => (hasTarget && targetPrice > 0) ? convertPrice(targetPrice, sym, selectedCurrency, rates) : null,
    [targetPrice, sym, selectedCurrency, rates, hasTarget]
  );
  const showTargetConversion =
    convertedTarget !== null &&
    (SYMBOL_TO_ISO[sym] || 'USD') !== selectedCurrency;

  // Currency symbol to show inside the target price input
  const targetInputSym = showTargetConversion
    ? (CURRENCY_SYMBOLS[selectedCurrency] || selectedCurrency)
    : sym;

  // Human-readable target price string in the display currency
  const targetDisplayStr = showTargetConversion && convertedTarget
    ? `${convertedTarget.displaySym}${convertedTarget.displayPrice.toFixed(2)}`
    : hasTarget ? `${sym}${targetPrice?.toFixed(2)}` : null;

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

  /* ── Target price save handler (converts display currency → native) ── */
  const handleTargetSave = async () => {
    const display = parseFloat(newTarget);
    if (!display || display <= 0) return;

    // Convert entered amount from selectedCurrency → product's native currency
    let nativePrice = display;
    if (rates && showTargetConversion) {
      const fromISO  = SYMBOL_TO_ISO[sym] || 'USD';
      const fromRate = rates[fromISO] || 1;
      const toRate   = rates[selectedCurrency] || 1;
      nativePrice = (display / toRate) * fromRate;
    }

    setTargetSaving(true);
    try {
      const { data } = await axios.put(`/api/products/${_id}/target`, { targetPrice: nativePrice });
      if (onTargetUpdate) onTargetUpdate(data);
      setEditingTarget(false);
      setNewTarget('');
    } catch (err) {
      console.error('Target update failed:', err.message);
    } finally {
      setTargetSaving(false);
    }
  };

  /* ── Feature 2: Compare handler ── */
  const handleCompare = async () => {
    // Toggle panel closed if already open
    if (compareOpen) { setCompareOpen(false); return; }

    setCompareOpen(true);

    // Results cached in state — don't re-fetch
    if (compareResults !== null) return;

    setCompareLoading(true);
    try {
      const { data } = await axios.get(
        `/api/products/search?q=${encodeURIComponent(title)}`
      );
      setCompareResults(data.results || []);
    } catch (err) {
      console.error('Compare search failed:', err.message);
      setCompareResults([]);
    } finally {
      setCompareLoading(false);
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

        {/* % drop badge — top left */}
        {isDropped && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white
                          text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            {priceDropPct}% drop
          </div>
        )}

        {/* All-time low badge — top right */}
        {isBelowTarget && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white
                          text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            All-time low
          </div>
        )}

        {/* Above-target badge — shows target in display currency if conversion available */}
        {isAboveTarget && !isDropped && (
          <div className="absolute top-2 right-2 bg-red-400 text-white
                          text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {targetDisplayStr || `${sym}${targetPrice?.toFixed(2)}`} target
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

        {/* ── Prices (Feature 1) ── */}
        <div className="flex items-end gap-2 mt-0.5">
          {showConversion ? (
            /* Converted price (orange bold) + original struck through */
            <div className="flex flex-col gap-0.5">
              <p className="text-2xl font-bold text-[#F97316]">
                {converted.displaySym}{converted.displayPrice.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 line-through leading-none">
                {currentPrice > 0 ? `${sym}${currentPrice.toFixed(2)} original` : 'N/A'}
              </p>
            </div>
          ) : (
            /* No conversion needed — show scraped price as-is */
            <p className="text-2xl font-bold text-[#F97316]">
              {currentPrice > 0 ? `${sym}${currentPrice.toFixed(2)}` : 'N/A'}
            </p>
          )}

          {initialPrice > 0 && !showConversion && (
            <p className="text-sm text-gray-400 line-through mb-0.5">
              {sym}{initialPrice.toFixed(2)}
            </p>
          )}
          {initialPrice > 0 && !showConversion && (
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

        {/* Price-to-target progress bar — target shown in selected display currency */}
        {hasTarget && (
          <div className="mt-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span className="flex items-center gap-1">
                Target: <span className="font-medium text-gray-600">{targetDisplayStr}</span>
                {showTargetConversion && (
                  <span className="text-gray-300">({sym}{targetPrice?.toFixed(2)})</span>
                )}
              </span>
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

        {/* ── Inline Target Price Editor ── */}
        {editingTarget ? (
          <div className="flex items-center gap-2 mt-2 animate-fade-in">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                {targetInputSym}
              </span>
              <input
                id={`target-edit-input-${_id}`}
                type="number"
                step="0.01"
                min="0"
                className="w-full pl-6 pr-2 py-1.5 text-sm border border-[#F97316]/40 rounded-xl
                           focus:outline-none focus:ring-1 focus:ring-[#F97316]/30"
                placeholder="Enter target"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTargetSave();
                  if (e.key === 'Escape') { setEditingTarget(false); setNewTarget(''); }
                }}
                autoFocus
              />
            </div>
            <button
              onClick={handleTargetSave}
              disabled={targetSaving}
              className="text-xs font-semibold text-white bg-[#F97316] px-3 py-1.5 rounded-xl
                         hover:bg-orange-600 transition-colors disabled:opacity-50 shrink-0"
            >
              {targetSaving ? '…' : 'Set'}
            </button>
            <button
              onClick={() => { setEditingTarget(false); setNewTarget(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            id={`set-target-btn-${_id}`}
            onClick={() => {
              setEditingTarget(true);
              // Pre-fill with current target in display currency
              if (hasTarget) {
                const prefill = showTargetConversion && convertedTarget
                  ? convertedTarget.displayPrice
                  : targetPrice;
                setNewTarget(prefill.toFixed(2));
              }
            }}
            className="w-full text-xs text-gray-400 hover:text-[#F97316] transition-colors
                       text-left mt-1 flex items-center gap-1 group"
          >
            <svg className="w-3 h-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {hasTarget ? `Edit target (${targetInputSym})` : `Set target price (${targetInputSym})`}
          </button>
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

        {/* ── Feature 2: Compare Prices ── */}
        <button
          id={`compare-btn-${_id}`}
          onClick={handleCompare}
          className="flex items-center justify-between w-full text-xs text-gray-400
                     hover:text-[#F97316] transition-colors pt-1 border-t border-gray-100 mt-1"
        >
          <span className="font-medium flex items-center gap-1">
            🔍 Compare prices
          </span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${compareOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {compareOpen && (
          <div className="animate-fade-in mt-1">
            {/* Loading spinner */}
            {compareLoading && (
              <div className="flex items-center justify-center py-5 gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4 animate-spin text-[#F97316]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching for best prices…
              </div>
            )}

            {/* Results */}
            {!compareLoading && compareResults !== null && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {compareResults.length > 0 ? (
                  <ul className="divide-y divide-gray-50">
                    {compareResults.map((result, idx) => (
                      <li key={idx} className="px-3 py-2.5 flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 truncate">
                            {result.displayLink}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                            {result.snippet}
                          </p>
                        </div>
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#F97316] hover:underline shrink-0 mt-0.5"
                        >
                          View →
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  /* Fallback: shopping comparison links (always useful) */
                  <div className="p-3">
                    <p className="text-xs text-gray-400 mb-2 font-medium">Search across stores:</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        {
                          label: '🛒 Amazon',
                          href: `https://www.amazon.com/s?k=${encodeURIComponent(title)}`,
                        },
                        {
                          label: '🛍️ Google Shopping',
                          href: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title)}`,
                        },
                        {
                          label: '🔨 eBay',
                          href: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(title)}`,
                        },
                        {
                          label: '🛒 Daraz',
                          href: `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(title)}`,
                        },
                      ].map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-3 py-2 rounded-lg
                                     bg-gray-50 hover:bg-orange-50 hover:border-[#F97316]/20
                                     border border-gray-100 transition-all duration-200 group"
                        >
                          <span className="text-xs font-medium text-gray-600 group-hover:text-gray-800">
                            {s.label}
                          </span>
                          <span className="text-xs text-[#F97316] font-semibold">Search →</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
