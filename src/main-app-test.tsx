import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Test the App component without loading problematic services
const TestApp = () => {
  const [status, setStatus] = React.useState('Loading...');

  React.useEffect(() => {
    const testApp = async () => {
      try {
        setStatus('Testing App component import...');
        const { default: App } = await import('./App');
        setStatus('✅ App component loaded successfully! Loading app...');
        
        // Try to render the app
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
          const appRoot = ReactDOM.createRoot(appContainer);
          appRoot.render(<App />);
          setStatus('✅ EarnPro App rendered successfully!');
        }
      } catch (error) {
        setStatus(`❌ Failed to load App: ${error.message}`);
        console.error('App loading error:', error);
      }
    };

    testApp();
  }, []);

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, sans-serif',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      <h1>🔍 EarnPro App Loading Test</h1>
      <p>Status: {status}</p>
      <div id="app-container" style={{ marginTop: '20px' }}></div>
    </div>
  );
};

console.log('🚀 Starting App Loading Test...');

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(<TestApp />);
console.log('✅ Test app loaded');
