import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-working.tsx';
import './index.css';

// Simple error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class SimpleErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#fee2e2',
          color: '#dc2626',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1>Something went wrong</h1>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log('🚀 Starting EarnPro Application...');

const root = document.getElementById('root');

if (!root) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found. Failed to mount React application.');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <SimpleErrorBoundary>
      <App />
    </SimpleErrorBoundary>
  </React.StrictMode>,
);

console.log('✅ EarnPro Application rendered successfully');
