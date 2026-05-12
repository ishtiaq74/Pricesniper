import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AddProductForm from '../components/AddProductForm';
import ProductCard from '../components/ProductCard';
import { AnnouncementBar, Logo, Footer } from './HomePage';

/**
 * Dashboard – authenticated main page of PriceSniper.
 *
 * Feature additions:
 *  - Currency selector dropdown (BDT default, stored in localStorage)
 *  - Live exchange rates fetched from GET /api/products/rates on mount
 *  - selectedCurrency + rates passed into every ProductCard
 */

const CURRENCY_OPTIONS = ['BDT', 'USD', 'INR', 'EUR', 'GBP'];

const Dashboard = () => {
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [profileOpen, setProfileOpen]   = useState(false);
  const [savingsOpen, setSavingsOpen]   = useState(false);

  // ── Currency Feature ──────────────────────────────────────────────────────
  const [selectedCurrency, setSelectedCurrency] = useState(
    () => localStorage.getItem('ps_currency') || 'BDT'
  );
  const [rates, setRates]           = useState(null);  // { USD:1, BDT:110, ... }
  const [ratesLoading, setRatesLoading] = useState(false);

  const { user, logout } = useAuth();

  /* ── Derived stats ─────────────────────────────────────────────── */
  const totalTracked = products.length;

  const activeDeals = products.filter(
    (p) => p.targetPrice && p.currentPrice <= p.targetPrice
  ).length;

  const dealsWithSavings = products
    .filter((p) => p.initialPrice > p.currentPrice)
    .map((p) => ({
      _id:          p._id,
      title:        p.title,
      initialPrice: p.initialPrice,
      currentPrice: p.currentPrice,
      saved:        p.initialPrice - p.currentPrice,
      currency:     p.currency || '$',
    }));

  const avgSavings =
    products.length > 0
      ? (
          products.reduce(
            (sum, p) => sum + Math.max(0, p.initialPrice - p.currentPrice),
            0
          ) / products.length
        ).toFixed(2)
      : '0.00';

  /* ── Fetch products ─────────────────────────────────────────────── */
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

  /* ── Fetch exchange rates ───────────────────────────────────────── */
  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const { data } = await axios.get('/api/products/rates');
      setRates(data.rates);
    } catch (err) {
      console.warn('Could not fetch exchange rates:', err.message);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); fetchRates(); }, [fetchProducts, fetchRates]);

  /* ── Currency change handler ───────────────────────────────────── */
  const handleCurrencyChange = (e) => {
    const c = e.target.value;
    setSelectedCurrency(c);
    localStorage.setItem('ps_currency', c);
  };

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleProductAdded      = (p)   => setProducts((prev) => [p, ...prev]);
  const handleProductRefreshed  = (upd) => setProducts((prev) =>
    prev.map((p) => (p._id === upd._id ? upd : p))
  );
  const handleProductDeleted    = (id)  => setProducts((prev) =>
    prev.filter((p) => p._id !== id)
  );

  /* ── Helpers ───────────────────────────────────────────────────── */
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  /* ── Skeleton card ─────────────────────────────────────────────── */
  const SkeletonCard = () => (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-1.5 bg-gray-100 rounded-full" />
        <div className="h-9 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );

  /* ── Stat cards config ─────────────────────────────────────────── */
  const stats = [
    {
      id:    'stat-tracked',
      icon:  '📦',
      value: totalTracked,
      label: 'Products Tracked',
      clickable: false,
    },
    {
      id:    'stat-deals',
      icon:  '🏷️',
      value: activeDeals,
      label: 'Active Deals',
      clickable: false,
    },
    {
      id:    'stat-savings',
      icon:  '💰',
      value: `$${avgSavings}`,
      label: 'Avg. Savings',
      clickable: true,
    },
  ];

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen flex flex-col bg-white"
      onClick={() => { profileOpen && setProfileOpen(false); }}
    >
      {/* Announcement bar */}
      <AnnouncementBar />

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Logo />

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-[#F97316] transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
            <a href="#" className="hover:text-[#F97316] transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              My Products
            </a>
            <a href="#" className="hover:text-[#F97316] transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Price History
            </a>
          </div>

          {/* Right: currency selector + live badge + user pill */}
          <div className="flex items-center gap-3">

            {/* ── Currency Selector (Feature 1) ── */}
            <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
              <span className="absolute left-2.5 text-xs text-gray-400 pointer-events-none">
                {ratesLoading ? '⟳' : '💱'}
              </span>
              <select
                id="currency-selector"
                value={selectedCurrency}
                onChange={handleCurrencyChange}
                className="pl-7 pr-2 py-1.5 text-xs font-semibold text-gray-700 bg-white
                           border border-gray-200 rounded-lg appearance-none cursor-pointer
                           hover:border-[#F97316]/50 focus:outline-none focus:ring-1
                           focus:ring-[#F97316]/30 transition-all duration-200"
                title="Display currency"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Live tracking badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200
                            text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Tracking
            </div>

            {/* User avatar pill */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                id="user-profile-btn"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 border border-gray-200 rounded-full
                           px-3 py-1.5 hover:border-[#F97316]/50 transition-all duration-200
                           bg-white shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center
                                text-white text-xs font-bold shrink-0">
                  {initials[0]}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {user?.name?.split(' ')[0]}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200
                               ${profileOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200
                                rounded-2xl shadow-xl animate-fade-in z-30">
                  {/* User info */}
                  <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center
                                      justify-center text-white font-bold text-sm">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats mini */}
                  <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-3 text-center">
                    <div>
                      <p className="text-base font-bold text-gray-900">{totalTracked}</p>
                      <p className="text-xs text-gray-400">Tracked</p>
                    </div>
                    <div className="border-x border-gray-100">
                      <p className="text-base font-bold text-emerald-500">{activeDeals}</p>
                      <p className="text-xs text-gray-400">Deals Hit</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#F97316]">${avgSavings}</p>
                      <p className="text-xs text-gray-400">Avg Saved</p>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="p-2">
                    <button
                      id="logout-btn"
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
                                 text-sm text-red-500 hover:text-red-600 hover:bg-red-50
                                 transition-all duration-200 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Stat Cards ── */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in">
            {stats.map((stat) => (
              <div key={stat.id}>
                <button
                  id={stat.id}
                  disabled={!stat.clickable}
                  onClick={() => stat.clickable && setSavingsOpen((o) => !o)}
                  className={`w-full text-left bg-white border border-gray-200 rounded-2xl
                               shadow-sm px-5 py-4 flex items-center gap-4
                               transition-all duration-200
                               ${stat.clickable
                                 ? 'hover:border-[#F97316]/40 hover:shadow-md cursor-pointer'
                                 : 'cursor-default'}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100
                                  flex items-center justify-center text-xl shrink-0">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                  </div>
                  {stat.clickable && (
                    <svg
                      className={`w-4 h-4 text-gray-300 ml-auto transition-transform duration-200
                                   ${savingsOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Savings breakdown panel */}
                {stat.clickable && savingsOpen && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-2xl shadow-sm
                                  overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700">💸 Deal Breakdown</h3>
                    </div>
                    {dealsWithSavings.length === 0 ? (
                      <p className="text-xs text-gray-400 px-4 py-4 text-center">
                        No price drops recorded yet.
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {dealsWithSavings.map((d) => (
                          <li key={d._id} className="px-4 py-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-gray-700 line-clamp-1 flex-1">
                              {d.title}
                            </p>
                            <div className="flex items-center gap-3 shrink-0 text-xs">
                              <span className="text-gray-400 line-through">
                                {d.currency}{d.initialPrice.toFixed(2)}
                              </span>
                              <span className="font-bold text-[#F97316]">
                                {d.currency}{d.currentPrice.toFixed(2)}
                              </span>
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200
                                              px-2 py-0.5 rounded-full font-semibold">
                                −{d.currency}{d.saved.toFixed(2)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Add Product Form ── */}
        <div className="mb-8">
          <AddProductForm onProductAdded={handleProductAdded} />
        </div>

        {/* ── Section title ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            My Tracked Products ⚡
            {totalTracked > 0 && (
              <span className="bg-orange-100 text-[#F97316] text-xs font-bold
                               px-2 py-0.5 rounded-full">
                {totalTracked}
              </span>
            )}
          </h2>
          {totalTracked > 0 && (
            <a href="#" className="text-sm text-[#F97316] hover:underline font-medium flex items-center gap-1">
              View all
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-3 rounded-xl
                          text-sm flex items-center gap-2 mb-6 animate-fade-in">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Skeletons ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && products.length === 0 && !error && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm
                          flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100
                            flex items-center justify-center mb-4 text-3xl">
              📦
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">No products tracked yet</h3>
            <p className="text-gray-400 text-sm max-w-xs">
              Paste any product URL above to start tracking its price and get alerted on drops.
            </p>
          </div>
        )}

        {/* ── Product Grid ── */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onRefresh={handleProductRefreshed}
                onDelete={handleProductDeleted}
                selectedCurrency={selectedCurrency}
                rates={rates}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
