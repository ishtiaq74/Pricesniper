import React, { useState } from 'react';
import axios from 'axios';

/**
 * AddProductForm
 * Controlled form to submit a product URL and optional target price.
 * Redesigned to match the "Track a New Product" card style in the new UI.
 *
 * Props:
 *  - onProductAdded : (newProduct) => void — called after successful add
 */
const AddProductForm = ({ onProductAdded }) => {
  const [url, setUrl]               = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

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
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h2 className="text-sm font-semibold text-gray-700">Track a New Product</h2>
      </div>

      {/* URL row */}
      <input
        id="product-url-input"
        type="url"
        className="input-field text-sm mb-3"
        placeholder="Paste Amazon product URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        disabled={loading}
      />

      {/* Target + Submit row */}
      <div className="flex gap-2">
        <input
          id="target-price-input"
          type="number"
          step="0.01"
          min="0"
          className="input-field text-sm flex-1"
          placeholder="Target price (optional)"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          disabled={loading}
        />
        <button
          id="add-product-btn"
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary flex items-center gap-2 whitespace-nowrap text-sm px-5"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scraping…
            </>
          ) : (
            <>
              Snipe
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 text-red-500 text-sm bg-red-50
                        border border-red-200 rounded-xl px-4 py-3 animate-fade-in">
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
