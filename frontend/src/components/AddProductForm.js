import React, { useState } from 'react';
import axios from 'axios';

/**
 * AddProductForm
 * Controlled form to submit a product URL and optional target price.
 *
 * Props:
 *  - onProductAdded : (newProduct) => void  — called after successful add
 */
const AddProductForm = ({ onProductAdded }) => {
  const [url, setUrl] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post('/api/products', {
        url: url.trim(),
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      });
      onProductAdded(data);
      setUrl('');
      setTargetPrice('');
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to add product. Check the URL and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Track a New Product</h2>
          <p className="text-xs text-gray-500">Paste a product URL to start tracking its price</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="product-url-input"
          type="url"
          className="input-field flex-1"
          placeholder="https://www.amazon.com/dp/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={loading}
        />
        <input
          id="target-price-input"
          type="number"
          step="0.01"
          min="0"
          className="input-field w-full sm:w-44"
          placeholder="Target price (e.g. 500)"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          disabled={loading}
        />
        <button
          id="add-product-btn"
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary whitespace-nowrap flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scraping…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Track Price
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 text-rose-400 text-sm bg-rose-500/10
                        border border-rose-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </form>
  );
};

export default AddProductForm;
