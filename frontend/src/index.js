import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// Point all axios calls to the correct backend.
// In development:  REACT_APP_API_URL=http://localhost:5000  (via .env.development)
// In production:   REACT_APP_API_URL=https://pricesniper-api.onrender.com  (set in Vercel dashboard)
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
