import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CreditCard, TestTube, Settings } from 'lucide-react';

const BraintreeTestPage: React.FC = () => {
  const { theme } = useTheme();

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
          <TestTube className="w-8 h-8 mr-3 text-blue-400" />
          Braintree Test Page
        </h1>
        
        <div className={`${cardClass} p-6 mb-6`}>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <CreditCard className="w-6 h-6 mr-2 text-green-400" />
            Payment Testing Environment
          </h2>
          <p className="text-white/70 mb-4">
            This page is for testing Braintree payment integration. Use sandbox credentials for testing.
          </p>
          
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-4">
            <h3 className="text-blue-300 font-medium mb-2">Test Credit Card Numbers:</h3>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• Visa: 4111111111111111</li>
              <li>• Mastercard: 5555555555554444</li>
              <li>• American Express: 378282246310005</li>
            </ul>
          </div>
          
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-yellow-300 font-medium mb-2">Test Details:</h3>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• Expiry: Any future date</li>
              <li>• CVV: Any 3-4 digit number</li>
              <li>• Amount: $15.00 (activation fee)</li>
            </ul>
          </div>
        </div>

        <div className={`${cardClass} p-6`}>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-purple-400" />
            Integration Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Braintree SDK</span>
              <span className="text-green-400 font-medium">✓ Loaded</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Environment</span>
              <span className="text-blue-400 font-medium">Sandbox</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Payment Processing</span>
              <span className="text-green-400 font-medium">✓ Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BraintreeTestPage;