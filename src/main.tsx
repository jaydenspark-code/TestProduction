import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
// import { registerSW } from 'virtual:pwa-register';
import { initializeSentry } from './utils/sentry';

// Initialize Sentry in production
initializeSentry();

// Temporarily disable PWA initialization for debugging
/*
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // Handle PWA update notification
      console.log('New content available, please refresh');
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}
*/

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found. Failed to mount React application.');
}

console.log('main.tsx: About to render App');
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
console.log('main.tsx: App render call complete');
