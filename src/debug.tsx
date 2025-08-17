// Debug version to test basic React loading
import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('🔍 DEBUG: Starting minimal React test...');

// Simple test component
function TestApp() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#1a1a1a',
      color: 'white',
      minHeight: '100vh'
    }}>
      <h1>🚀 EarnPro Debug Test</h1>
      <p>If you see this, React is working!</p>
      <div style={{ marginTop: '20px' }}>
        <p>✅ React: OK</p>
        <p>✅ DOM: OK</p>
        <p>✅ TypeScript: OK</p>
      </div>
    </div>
  );
}

const root = document.getElementById('root');

if (!root) {
  console.error('❌ DEBUG: Root element not found!');
} else {
  console.log('✅ DEBUG: Root element found');
  ReactDOM.createRoot(root).render(<TestApp />);
  console.log('✅ DEBUG: App rendered successfully');
}
