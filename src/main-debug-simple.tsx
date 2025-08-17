import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Simple test component
const SimpleApp = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">EarnPro Debug Test</h1>
        <p className="text-xl">If you can see this, the basic setup is working!</p>
        <div className="mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg">
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
};

console.log('🚀 Starting EarnPro Debug Version...');

const root = document.getElementById('root');
if (!root) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>
);

console.log('✅ EarnPro Debug version loaded successfully!');
