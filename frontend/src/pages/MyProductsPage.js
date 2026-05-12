import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnnouncementBar, Logo, Footer } from './HomePage';

/* ── helpers ───────────────────────────────────────────────────────────── */
function inferPlatform(url = '') {
  const u = url.toLowerCase();
  if (u.includes('amazon'))  return 'Amazon';
  if (u.includes('daraz'))   return 'Daraz';
  if (u.includes('ebay'))    return 'eBay';
  if (u.includes('othoba'))  return 'Othoba';
  return 'Other';
}

function relativeTime(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins  / 60);
  const days  = Math.floor(hours / 24);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function statusBadge(currentPrice, targetPrice) {
  if (!targetPrice) return { label: 'No Target',     color: 'bg-gray-100 text-gray-500 border-gray-200' };
  if (currentPrice <= targetPrice) return { label: 'Below Target', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  return { label: 'Above Target', color: 'bg-red-50 text-red-600 border-red-200' };
}

function truncate(str = '', n = 50) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/* ── spinner ───────────────────────────────────────────────────────────── */
const Spinner = ({ small }) => (
  <svg
    className={`animate-spin ${small ? 'w-4 h-4' : 'w-8 h-8'} text-[#F97316]`}
    fill="none" viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/* ── platform pill ──────────────────────────────────────────────────────── */
const platformColor = { Amazon: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Daraz: 'bg-orange-50 text-[#F97316] border-orange-200',
  eBay:  'bg-blue-50 text-blue-700 border-blue-200',
  Othoba:'bg-purple-50 text-purple-700 border-purple-200',
  Other: 'bg-gray-100 text-gray-600 border-gray-200' };

/* ══════════════════════════════════════════════════════════════════════════
   MyProductsPage
══════════════════════════════════════════════════════════════════════════ */
const MyProductsPage = () => {
  const { user, logout } = useAuth();
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [sort, setSort]               = useState('newest');
  const [profileOpen, setProfileOpen] = useState(false);
  /* per-row action loading: { [id]: 'refresh'|'delete'|null } */
  const [rowLoading, setRowLoading]   = useState({});

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  /* ── fetch ────────────────────────────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/products');
      setProducts(data);
    } catch {
      setError('Could not load products. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── actions ──────────────────────────────────────────────────────── */
  const handleRefresh = async (id) => {
    setRowLoading(prev => ({ ...prev, [id]: 'refresh' }));
    try {
      const { data } = await axios.put(`/api/products/${id}/refresh`);
      setProducts(prev => prev.map(p => p._id === id ? data : p));
    } catch {
      /* silent */
    } finally {
      setRowLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product from tracking?')) return;
    setRowLoading(prev => ({ ...prev, [id]: 'delete' }));
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch {
      /* silent */
    } finally {
      setRowLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  /* ── filter + sort ────────────────────────────────────────────────── */
  const lastUpdated = (p) => {
    const h = p.priceHistory;
    return h && h.length ? new Date(h[h.length - 1].date || h[h.length - 1].timestamp || 0).getTime() : 0;
  };

  const visible = products
    .filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sort) {
        case 'oldest':    return lastUpdated(a) - lastUpdated(b);
        case 'price-asc': return (a.currentPrice || 0) - (b.currentPrice || 0);
        case 'price-desc':return (b.currentPrice || 0) - (a.currentPrice || 0);
        case 'name-az':   return (a.title || '').localeCompare(b.title || '');
        default:          return lastUpdated(b) - lastUpdated(a); // newest
      }
    });

  /* ══════════════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col bg-white" onClick={() => profileOpen && setProfileOpen(false)}>
      <AnnouncementBar />

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-[#F97316] transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link to="/products" className="text-[#F97316] flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              My Products
            </Link>
          </div>

          {/* Right: user pill */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              id="user-profile-btn-products"
              onClick={() => setProfileOpen(prev => !prev)}
              className="flex items-center gap-2 border border-gray-200 rounded-full
                         px-3 py-1.5 hover:border-[#F97316]/50 transition-all duration-200 bg-white shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials[0]}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 p-2">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  id="logout-btn-products"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500
                             hover:bg-red-50 transition-all duration-200 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Tracked Products</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor prices, refresh data, and manage your watchlist.</p>
        </div>

        {/* ── Toolbar ── */}
        {!loading && products.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="products-search"
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316]/50
                           transition-all duration-200"
              />
            </div>
            {/* Sort */}
            <select
              id="products-sort"
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316]/50
                         transition-all duration-200 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-az">Name A–Z</option>
            </select>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <Spinner />
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-6">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center
                          border border-dashed border-gray-200 rounded-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100
                            flex items-center justify-center text-3xl mb-4">📦</div>
            <h3 className="text-base font-bold text-gray-900 mb-2">No products tracked yet</h3>
            <p className="text-gray-400 text-sm max-w-xs mb-6">
              You haven't tracked any products yet. Go to Dashboard to add one.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-orange-500
                         text-white text-sm font-semibold px-5 py-2.5 rounded-xl
                         transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* ── No search results ── */}
        {!loading && !error && products.length > 0 && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <p className="text-gray-400 text-sm">No products match "<strong>{search}</strong>"</p>
            <button onClick={() => setSearch('')}
              className="mt-3 text-sm text-[#F97316] hover:underline font-medium">Clear search</button>
          </div>
        )}

        {/* ── Desktop Table ── */}
        {!loading && visible.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['#','Product','Platform','Current Price','Target Price','Status','Last Updated','Actions']
                      .map(h => (
                        <th key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map((p, i) => {
                    const platform = inferPlatform(p.url);
                    const badge    = statusBadge(p.currentPrice, p.targetPrice);
                    const lastH    = p.priceHistory?.length
                      ? p.priceHistory[p.priceHistory.length - 1]
                      : null;
                    const rl = rowLoading[p._id];

                    return (
                      <tr key={p._id} className="hover:bg-orange-50/30 transition-colors duration-150">
                        {/* # */}
                        <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>

                        {/* Product */}
                        <td className="px-4 py-3 max-w-[260px]">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={p.image} alt={p.title}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100
                                              flex items-center justify-center text-sm shrink-0">📦</div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate" title={p.title}>
                                {truncate(p.title)}
                              </p>
                              <a href={p.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-gray-400 hover:text-[#F97316] truncate block max-w-[180px] transition-colors">
                                {p.url}
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Platform */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${platformColor[platform]}`}>
                            {platform}
                          </span>
                        </td>

                        {/* Current Price */}
                        <td className="px-4 py-3">
                          {p.currentPrice != null
                            ? <span className="font-bold text-gray-900">{p.currency || '$'}{p.currentPrice.toFixed(2)}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Target Price */}
                        <td className="px-4 py-3">
                          {p.targetPrice
                            ? <span className="text-gray-700">{p.currency || '$'}{p.targetPrice.toFixed(2)}</span>
                            : <span className="text-gray-400 italic text-xs">Not set</span>}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                          {lastH ? relativeTime(lastH.date || lastH.timestamp) : 'Never'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              id={`refresh-${p._id}`}
                              onClick={() => handleRefresh(p._id)}
                              disabled={!!rl}
                              title="Refresh price"
                              className="w-8 h-8 flex items-center justify-center rounded-lg
                                         bg-orange-50 hover:bg-orange-100 text-[#F97316]
                                         border border-orange-200 transition-all duration-200
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {rl === 'refresh'
                                ? <Spinner small />
                                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>}
                            </button>
                            <button
                              id={`delete-${p._id}`}
                              onClick={() => handleDelete(p._id)}
                              disabled={!!rl}
                              title="Delete product"
                              className="w-8 h-8 flex items-center justify-center rounded-lg
                                         bg-red-50 hover:bg-red-100 text-red-500
                                         border border-red-200 transition-all duration-200
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {rl === 'delete'
                                ? <Spinner small />
                                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Card List ── */}
            <div className="md:hidden space-y-4 animate-fade-in">
              {visible.map((p) => {
                const platform = inferPlatform(p.url);
                const badge    = statusBadge(p.currentPrice, p.targetPrice);
                const lastH    = p.priceHistory?.length
                  ? p.priceHistory[p.priceHistory.length - 1] : null;
                const rl = rowLoading[p._id];

                return (
                  <div key={p._id}
                    className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3">
                    {/* Top row: thumb + title + badge */}
                    <div className="flex items-start gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.title}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100
                                        flex items-center justify-center text-xl shrink-0">📦</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${platformColor[platform]}`}>
                            {platform}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prices */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-[#F97316]">
                          {p.currentPrice != null
                            ? `${p.currency || '$'}${p.currentPrice.toFixed(2)}`
                            : '—'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Target:{' '}
                          {p.targetPrice
                            ? <span className="text-gray-600">{p.currency || '$'}{p.targetPrice.toFixed(2)}</span>
                            : <span className="italic">Not set</span>}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">{lastH ? relativeTime(lastH.date || lastH.timestamp) : 'Never'}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        id={`mobile-refresh-${p._id}`}
                        onClick={() => handleRefresh(p._id)}
                        disabled={!!rl}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium
                                   bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200
                                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rl === 'refresh' ? <Spinner small /> : <>🔄 Refresh</>}
                      </button>
                      <button
                        id={`mobile-delete-${p._id}`}
                        onClick={() => handleDelete(p._id)}
                        disabled={!!rl}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium
                                   bg-red-50 hover:bg-red-100 text-red-500 border border-red-200
                                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rl === 'delete' ? <Spinner small /> : <>🗑️ Delete</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Result count */}
            <p className="text-xs text-gray-400 mt-4 text-right">
              Showing {visible.length} of {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyProductsPage;
