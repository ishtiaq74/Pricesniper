import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Shared Layout pieces ─────────────────────────────────────── */

/** Top orange announcement bar */
const AnnouncementBar = () => (
  <div className="w-full bg-[#F97316] text-white text-center text-sm py-2.5 px-4 font-medium">
    ✦ New: Get instant email alerts the moment your tracked product hits your target price.{' '}
    <a href="/login" className="underline font-semibold hover:opacity-80 transition-opacity">
      Sign up free →
    </a>
  </div>
);

/** Logo mark used in Navbar and Footer */
const Logo = ({ size = 'md' }) => {
  const sz = size === 'sm' ? 'w-7 h-7 text-sm' : 'w-9 h-9 text-base';
  return (
    <div className="flex items-center gap-2">
      <div className={`${sz} rounded-xl bg-[#F97316] flex items-center justify-center shadow-sm shrink-0`}>
        {/* crosshair / sniper icon */}
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="8" strokeWidth={2} />
          <line x1="12" y1="2" x2="12" y2="6"  strokeWidth={2} strokeLinecap="round" />
          <line x1="12" y1="18" x2="12" y2="22" strokeWidth={2} strokeLinecap="round" />
          <line x1="2"  y1="12" x2="6"  y2="12" strokeWidth={2} strokeLinecap="round" />
          <line x1="18" y1="12" x2="22" y2="12" strokeWidth={2} strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill="white" strokeWidth={0} />
        </svg>
      </div>
      <span className="font-bold text-gray-900 text-lg tracking-tight">
        Price<span className="text-[#F97316]">Sniper</span>
      </span>
    </div>
  );
};

/** Navbar for unauthenticated homepage */
const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Center links */}
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

        {/* Right: live badge + auth buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200
                          text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Tracking
          </div>
          <button
            id="navbar-signin-btn"
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors"
          >
            Sign In
          </button>
          <button
            id="navbar-signup-btn"
            onClick={() => navigate('/login')}
            className="btn-primary text-sm px-4 py-2"
          >
            Sign Up Free
          </button>
        </div>
      </div>
    </nav>
  );
};

/** Minimal footer */
const Footer = () => (
  <footer className="border-t border-gray-100 py-8 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                    flex flex-col sm:flex-row items-center justify-between gap-6">
      {/* Left: logo + tagline */}
      <div className="flex flex-col items-center sm:items-start gap-1">
        <Logo size="sm" />
        <p className="text-xs text-gray-400">Your smart Amazon price tracker</p>
      </div>

      {/* Center: links */}
      <div className="flex items-center gap-5 text-sm text-gray-500">
        {['About', 'Privacy', 'Terms', 'Contact'].map((l) => (
          <a key={l} href="#" className="hover:text-[#F97316] transition-colors">{l}</a>
        ))}
      </div>

      {/* Right: social icons */}
      <div className="flex items-center gap-3">
        {/* Twitter */}
        <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-[#F97316] transition-colors">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        {/* GitHub */}
        <a href="#" aria-label="GitHub" className="text-gray-400 hover:text-[#F97316] transition-colors">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
        {/* Email */}
        <a href="#" aria-label="Email" className="text-gray-400 hover:text-[#F97316] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </a>
      </div>
    </div>
  </footer>
);

/* ─── Platform Logos Section ────────────────────────────────────── */
const platforms = [
  {
    name: 'Amazon',
    bg: '#FF9900',
    logo: (
      <svg viewBox="0 0 48 48" className="w-7 h-7">
        <text x="4" y="36" fontSize="32" fontWeight="bold" fill="#FF9900">a</text>
      </svg>
    ),
  },
  {
    name: 'Shopify',
    bg: '#96BF48',
    logo: (
      <svg viewBox="0 0 48 48" className="w-7 h-7" fill="#96BF48">
        <path d="M38.3 10.2c0-.3-.3-.4-.5-.4l-3.7-.3-.9-.9C32.8 8.2 30 8 30 8l-1 1c-1-.3-2.1-.5-3.3-.5C22.1 8.5 19 10.8 17.8 14l-3.1.9c-.3.1-.3.4-.3.6l-1.2 19.4 14.4 2.5L38 35.6 38.3 10.2z"/>
      </svg>
    ),
  },
];

const PlatformLogos = () => {
  const items = [
    { name: 'Amazon',    color: '#FF9900', letter: 'a',  textColor: '#FF9900' },
    { name: 'Shopify',   color: '#96BF48', letter: 'S',  textColor: '#96BF48' },
    { name: 'Walmart',   color: '#0071CE', letter: 'W',  textColor: '#0071CE' },
    { name: 'eBay',      color: '#E53238', letter: 'e',  textColor: '#E53238' },
    { name: 'AliExpress',color: '#FF4747', letter: 'Ali', textColor: '#FF4747' },
  ];

  return (
    <div className="mt-10 animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm inline-flex flex-col sm:flex-row
                      items-center gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          Track across <span className="text-[#F97316]">50+</span> platforms
        </p>
        <div className="flex items-center gap-2">
          {items.map((p) => (
            <div
              key={p.name}
              title={p.name}
              className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100
                         flex items-center justify-center font-bold text-sm shadow-sm hover:shadow-md
                         transition-shadow duration-200"
              style={{ color: p.textColor }}
            >
              {p.letter}
            </div>
          ))}
          {/* Overflow badge */}
          <div className="w-11 h-11 rounded-xl bg-[#F97316] text-white flex items-center
                          justify-center text-xs font-bold shadow-sm">
            +45
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Hero / Track Form ─────────────────────────────────────────── */
const HeroTrackForm = () => {
  const [url, setUrl]         = useState('');
  const [target, setTarget]   = useState('');
  const navigate = useNavigate();

  const handleSnipe = (e) => {
    e.preventDefault();
    // Redirect to login so the user can authenticate and then track
    navigate('/login');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 animate-fade-in">
      {/* Pill badge */}
      <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200
                      text-[#F97316] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
        Price Tracker
      </div>

      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-2">
        Track the world.
      </h1>
      <h2 className="text-4xl sm:text-5xl font-extrabold text-[#F97316] leading-tight mb-5">
        Never Overpay Again.
      </h2>

      {/* Subtext */}
      <p className="text-gray-500 text-base max-w-md mb-10 leading-relaxed">
        Paste any product URL, set your target price, and we'll alert you the instant it drops.
        Real-time tracking, no hassle.
      </p>

      {/* Track card */}
      <div className="max-w-lg bg-white border border-gray-200 rounded-2xl shadow-md p-5 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-semibold text-gray-700">Track a New Product</span>
        </div>

        <form onSubmit={handleSnipe} className="flex flex-col gap-3">
          <input
            id="hero-url-input"
            type="text"
            className="input-field text-sm"
            placeholder="Paste Amazon product URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <input
              id="hero-target-input"
              type="number"
              step="0.01"
              min="0"
              className="input-field text-sm flex-1"
              placeholder="Target price (optional)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <button
              id="hero-snipe-btn"
              type="submit"
              className="btn-primary flex items-center gap-2 whitespace-nowrap text-sm px-5"
            >
              Snipe
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Platform logos */}
      <PlatformLogos />
    </section>
  );
};

/* ─── HomePage ──────────────────────────────────────────────────── */
const HomePage = () => (
  <div className="min-h-screen flex flex-col bg-white">
    <AnnouncementBar />
    <Navbar />
    <main className="flex-1">
      <HeroTrackForm />
    </main>
    <Footer />
  </div>
);

export default HomePage;
export { AnnouncementBar, Logo, Footer };
