import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Test if we can import the problematic service
console.log('🔍 Testing imports...');

const TestApp = () => {
  const [errorMessage, setErrorMessage] = React.useState('');

  const testImports = async () => {
    console.log('🔍 Starting import test...');
    setErrorMessage('Testing imports...');
    
    try {
      console.log('Testing authEmailService import...');
      const { authEmailService } = await import('./services/authEmailService');
      console.log('✅ authEmailService imported successfully:', authEmailService);
      
      console.log('Testing hybridEmailService import...');
      const { hybridEmailService } = await import('./services/hybridEmailService');
      console.log('✅ hybridEmailService imported successfully:', hybridEmailService);
      
      setErrorMessage('✅ All imports successful!');
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(`❌ Import Error: ${errorMsg}`);
    }
  };

  React.useEffect(() => {
    testImports();
  }, []);

  const handleButtonClick = () => {
    console.log('🔄 Button clicked - testing imports...');
    testImports();
  };

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, sans-serif',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      <h1>🔍 EarnPro Import Diagnostic</h1>
      <p>Testing problematic imports...</p>
      
      <div style={{
        background: errorMessage.includes('❌') ? '#fee2e2' : '#dcfce7',
        color: errorMessage.includes('❌') ? '#dc2626' : '#166534',
        padding: '20px',
        borderRadius: '8px',
        margin: '20px 0',
        minHeight: '60px',
        border: '1px solid ' + (errorMessage.includes('❌') ? '#fecaca' : '#bbf7d0')
      }}>
        <h3>Import Status:</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{errorMessage}</pre>
      </div>
      
      <button 
        onClick={handleButtonClick}
        onMouseDown={(e) => {
          console.log('Mouse down on button');
          e.preventDefault();
        }}
        style={{
          padding: '12px 24px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px',
          fontSize: '16px',
          fontWeight: '500',
          userSelect: 'none',
          pointerEvents: 'auto'
        }}
      >
        Test Imports Again
      </button>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Check the browser console (F12) for detailed logs.
      </div>
    </div>
  );
};

console.log('🚀 Starting Import Diagnostic...');

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(<TestApp />);
console.log('✅ Diagnostic app loaded');
