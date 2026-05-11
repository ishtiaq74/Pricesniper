import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, AnnouncementBar } from './HomePage';

/**
 * AuthPage – Tabbed Login / Register page.
 * Light theme with orange accents matching the redesigned PriceSniper UI.
 */
const AuthPage = () => {
  const [tab, setTab]             = useState('login'); // 'login' | 'register'
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(name, email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar />

      {/* Simple top bar */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <Logo />
          </a>
          <p className="text-sm text-gray-400 hidden sm:block">
            {tab === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
              className="text-[#F97316] font-semibold hover:underline"
            >
              {tab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </nav>

      {/* Auth card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {tab === 'login' ? 'Welcome back 👋' : 'Create your account'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {tab === 'login'
                ? 'Sign in to continue tracking your deals'
                : 'Start tracking prices for free — no credit card needed'}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {['login', 'register'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize
                    ${tab === t
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {t === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus={tab === 'login'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  className="input-field"
                  placeholder={tab === 'register' ? 'At least 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-red-500 text-sm bg-red-50
                                border border-red-200 rounded-xl px-4 py-3 animate-fade-in">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading || !email || !password}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-1 py-3"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {tab === 'login' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {tab === 'login' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      )}
                    </svg>
                    {tab === 'login' ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </button>
            </form>

            {/* Switch hint */}
            <p className="text-center text-sm text-gray-400 mt-5">
              {tab === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
                className="text-[#F97316] hover:underline font-semibold transition-colors"
              >
                {tab === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        PriceSniper &mdash; Track smarter, save more.
      </footer>
    </div>
  );
};

export default AuthPage;
