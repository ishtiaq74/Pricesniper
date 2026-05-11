import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';

/**
 * App root – sets up React Router and wraps everything in the AuthProvider.
 *
 * Routes:
 *  /       → HomePage  (unauthenticated landing) | Dashboard (authenticated)
 *  /login  → AuthPage  (public sign-in / register)
 *  *       → redirect to /
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute fallback={<HomePage />}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
