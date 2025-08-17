import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PaymentSetupSimple: React.FC = () => {
  // ALL HOOKS FIRST - NO CONDITIONAL CALLS
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ALL useEffect hooks together
  useEffect(() => {
    console.log('🟣 Simple PaymentSetup: user =', user);
    if (typeof user !== 'undefined') {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Redirect if user is already paid
    if (user?.isPaidUser) {
      navigate('/dashboard');
    }
  }, [user?.isPaidUser, navigate]);

  // OAuth state extraction
  const fromOAuth = location.state?.fromOAuth;
  const oauthEmail = location.state?.email;
  const oauthProvider = location.state?.provider;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading payment page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            Complete Your Payment
          </h1>
          
          {fromOAuth && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
              <p className="text-green-200 text-center">
                ✅ Welcome! You signed up with {oauthProvider} ({oauthEmail})
              </p>
              <p className="text-green-200 text-center text-sm mt-2">
                Complete payment to activate your account and start earning.
              </p>
            </div>
          )}

          <div className="text-center">
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Account Activation Fee
              </h2>
              <p className="text-3xl font-bold text-blue-300 mb-4">$15.00 USD</p>
              
              <div className="space-y-4">
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-colors">
                  Pay with Braintree
                </button>
                
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors">
                  Pay with Paystack (For Africa)
                </button>
                
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors">
                  Pay with PayPal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSetupSimple;
