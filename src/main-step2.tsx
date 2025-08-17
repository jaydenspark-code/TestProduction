import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

// Skip Sentry and PWA for now to isolate the issue
console.log('🚀 Starting React app with App component...');

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found. Failed to mount React application.');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

console.log('✅ React app with App component rendered');
