import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Simple test components
const HomePage = () => (
  <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">EarnPro Home</h1>
      <p className="text-xl">Welcome to EarnPro!</p>
      <div className="mt-8 space-x-4">
        <a href="/login" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg inline-block">
          Login
        </a>
        <a href="/register" className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg inline-block">
          Register
        </a>
      </div>
    </div>
  </div>
);

const LoginPage = () => (
  <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Login</h1>
      <p className="text-xl">Login form will be here</p>
      <a href="/" className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg inline-block mt-4">
        Back to Home
      </a>
    </div>
  </div>
);

const RegisterPage = () => (
  <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Register</h1>
      <p className="text-xl">Registration form will be here</p>
      <a href="/" className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg inline-block mt-4">
        Back to Home
      </a>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

console.log('🚀 Starting EarnPro with Basic Routing...');

const root = document.getElementById('root');
if (!root) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('✅ EarnPro with routing loaded successfully!');
