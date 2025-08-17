import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Simple debug app
const DebugApp = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Debug App - React is Working!</h1>
      <p>If you can see this, React is loading correctly.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
};

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found. Failed to mount React application.');
}

console.log('🚀 Starting React app...');
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <DebugApp />
  </React.StrictMode>,
);
console.log('✅ React app rendered');
