import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Mail, Lock, Eye, EyeOff, LogIn, User } from 'lucide-react';
import GoogleOAuthButton from './GoogleOAuthButton';

const Login: React.FC = () => {
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const { login } = useAuth();
  const navigate = useNavigate();

  // Google OAuth removed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Login attempt for:', loginField);
      
      const result = await login(loginField, password);
      
      console.log('📝 Login result:', result);

      if (result.success) {
        console.log('✅ Login successful! Handling immediate redirect...');
        
        if (result.requires2FA) {
          console.log('🔐 2FA required, redirecting...');
          navigate('/verify-2fa');
          return;
        }

        // Use the user data returned from login function for immediate redirect
        const loggedInUser = result.user;
        console.log('👤 Logged in user data:', loggedInUser);

        // Test accounts - bypass all restrictions
        const testEmails = [
          'thearnest7@gmail.com',
          'ijaydenspark@gmail.com', 
          'princeedie142@gmail.com',
          'noguyliketrey@gmail.com',
          'ernest.debrah@bluecrest.edu.gh'
        ];
        
        const isTestAccount = testEmails.includes(loginField);
        
        if (isTestAccount) {
          console.log('🧪 Test account detected, redirecting to dashboard');
          navigate('/dashboard');
          return;
        }

        // For regular users: Handle redirect based on user status
        if (!loggedInUser) {
          // If no user data but login successful, assume verified user needs payment
          console.log('💳 Login successful, redirecting verified user to payment page');
          navigate('/payment', { 
            state: { 
              fromLogin: true, 
              email: loginField,
              verified: true 
            } 
          });
          return;
        }

        console.log('🔍 User status check:', {
          email: loggedInUser.email,
          isVerified: loggedInUser.isVerified,
          isPaidUser: loggedInUser.isPaidUser
        });

        // Redirect logic based on user status
        if (!loggedInUser.isVerified) {
          console.log('📧 User not verified, redirecting to verify-email');
          navigate('/verify-email');
        } else if (!loggedInUser.isPaidUser) {
          console.log('💳 User verified but not paid - redirecting to PAYMENT page');
          navigate('/payment', { 
            state: { 
              fromLogin: true, 
              email: loggedInUser.email,
              verified: true 
            } 
          });
        } else {
          console.log('✅ User verified and paid, redirecting to dashboard');
          navigate('/dashboard');
        }
        
      } else {
        console.log('❌ Login failed:', result.error);
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20';

  const inputClass = theme === 'professional'
    ? 'w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
    : 'w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200';

  const buttonClass = theme === 'professional'
    ? 'w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 flex items-center justify-center gap-2'
    : 'w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2';

  return (
    <div className={bgClass}>
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className={cardClass}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-300">Sign in to your EarnPro account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={loginField}
                    onChange={(e) => setLoginField(e.target.value)}
                    className={inputClass + ' pl-12'}
                    placeholder="Enter your email or username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass + ' pl-12 pr-12'}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={buttonClass}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* OAuth Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              <span className="mx-4 text-gray-400 dark:text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            </div>

            {/* Google OAuth Button */}
            <GoogleOAuthButton 
              mode="login" 
              disabled={loading}
            />

            <div className="mt-6 text-center">
              <p className="text-gray-300 text-sm">
                Don't have an account?{' '}
                <Link
                  to="/"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Register here
                </Link>
              </p>
            </div>

            {/* Quick Test Logins */}
            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-200 text-xs mb-2 font-medium">🧪 Quick Test Logins:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginField('thearnest7@gmail.com');
                    setPassword('1234567890');
                  }}
                  className="px-2 py-1 bg-green-600/50 text-white text-xs rounded border border-green-500/50 hover:bg-green-600/70"
                >
                  System
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginField('princeedie142@gmail.com');
                    setPassword('1234567890');
                  }}
                  className="px-2 py-1 bg-blue-600/50 text-white text-xs rounded border border-blue-500/50 hover:bg-blue-600/70"
                >
                  Patron
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginField('noguyliketrey@gmail.com');
                    setPassword('1234567890');
                  }}
                  className="px-2 py-1 bg-purple-600/50 text-white text-xs rounded border border-purple-500/50 hover:bg-purple-600/70"
                >
                  Tony
                </button>
              </div>
              <p className="text-yellow-200/70 text-xs mt-2">Password for all accounts: 1234567890</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;