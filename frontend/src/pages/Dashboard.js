import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AddProductForm from '../components/AddProductForm';
import ProductCard from '../components/ProductCard';

/**
 * Dashboard – the main (and only) page of PriceSniper.
 *
 * Responsibilities:
 *  - Fetch all tracked products from the backend on mount
 *  - Pass add / refresh / delete callbacks into child components
 *  - Display a responsive grid of ProductCard components
 *  - Show loading skeletons while fetching
 *  - Show an empty state when no products are tracked
 */
const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Stats derived from products ───────────────────────────────────────────
  const totalTracked = products.length;
  const activeDeals = products.filter(
    (p) => p.targetPrice && p.currentPrice <= p.targetPrice
  ).length;
  const avgSavings =
    products.length > 0
      ? (
          products.reduce(
            (sum, p) => sum + Math.max(0, p.initialPrice - p.currentPrice),
            0
          ) / products.length
        ).toFixed(2)
      : '0.00';

  // ── Fetch all products on mount ────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/products');
      setProducts(data);
    } catch (err) {
      setError('Could not load products. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProductAdded = (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleProductRefreshed = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
    );
  };

  const handleProductDeleted = (deletedId) => {
    setProducts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  const SkeletonCard = () => (
    <div className="card p-4 animate-pulse">
      <div className="h-44 bg-gray-800 rounded-xl mb-4" />
      <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-800 rounded w-1/2 mb-4" />
      <div className="h-8 bg-gray-800 rounded-xl mb-2" />
      <div className="h-28 bg-gray-800 rounded-xl mb-3" />
      <div className="h-10 bg-gray-800 rounded-xl" />
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700
                            flex items-center justify-center shadow-lg shadow-brand-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0
                  0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0
                  0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">PriceSniper</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Your smart discount tracker</p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
            Live Tracking
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in">
            {[
              { label: 'Products Tracked', value: totalTracked, icon: '📦' },
              { label: 'Active Deals', value: activeDeals, icon: '🎯' },
              { label: 'Avg. Savings', value: `$${avgSavings}`, icon: '💰' },
            ].map((stat) => (
              <div key={stat.label} className="card px-4 py-4 flex items-center gap-4">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Product Form */}
        <div className="mb-8">
          <AddProductForm onProductAdded={handleProductAdded} />
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            Tracked Products
            {totalTracked > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({totalTracked})
              </span>
            )}
          </h2>
        </div>

        {/* Error */}
        {error && (
          <div className="card border-rose-500/30 bg-rose-500/5 px-5 py-4 flex items-center
                          gap-3 text-rose-400 mb-6 animate-fade-in">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && !error && (
          <div className="card flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184
                  1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0
                  014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No products tracked yet</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Paste any product URL above to start tracking its price and get alerted on drops.
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onRefresh={handleProductRefreshed}
                onDelete={handleProductDeleted}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/60 mt-16 py-6 text-center text-xs text-gray-600">
        PriceSniper MVP &mdash; Built with MongoDB · Express · React · Node.js
      </footer>
    </div>
  );
};

export default Dashboard;
