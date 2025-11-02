import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './utils/i18n'; // Initialize i18n

// Polyfill for process.env
if (typeof process === 'undefined') {
  window.process = { env: {} };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
