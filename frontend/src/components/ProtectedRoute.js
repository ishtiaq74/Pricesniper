import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * If auth is still loading → full-screen loader.
 * If authenticated → renders children (Dashboard).
 * If unauthenticated → renders fallback prop (HomePage) if provided, else nothing.
 */
const ProtectedRoute = ({ children, fallback = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316] flex items-center justify-center shadow-lg animate-pulse">
            {/* crosshair icon */}
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="9" strokeWidth={2} />
              <line x1="12" y1="3" x2="12" y2="7" strokeWidth={2} strokeLinecap="round" />
              <line x1="12" y1="17" x2="12" y2="21" strokeWidth={2} strokeLinecap="round" />
              <line x1="3" y1="12" x2="7" y2="12" strokeWidth={2} strokeLinecap="round" />
              <line x1="17" y1="12" x2="21" y2="12" strokeWidth={2} strokeLinecap="round" />
              <circle cx="12" cy="12" r="2" fill="white" strokeWidth={0} />
            </svg>
          </div>
          <p className="text-gray-400 text-sm font-medium">Loading PriceSniper…</p>
        </div>
      </div>
    );
  }

  return user ? children : fallback;
};

export default ProtectedRoute;
