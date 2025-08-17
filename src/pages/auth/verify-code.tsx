import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import { Mail, CheckCircle, AlertCircle, Loader2, RefreshCw, ArrowRight } from 'lucide-react';

const VerifyCode: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');

  // Get user data from localStorage if user context is not available
  const userEmail = user?.email || localStorage.getItem('registrationEmail') || '';
  const userId = user?.id || localStorage.getItem('registrationUserId') || '';
  const fullName = user?.fullName || localStorage.getItem('registrationFullName') || '';

  useEffect(() => {
    // Redirect if no email or already verified
    if (!userEmail) {
      navigate('/register', { replace: true });
      return;
    }
    
    if (user?.isVerified) {
      navigate('/payment', { replace: true });
      return;
    }
  }, [userEmail, user?.isVerified, navigate]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-character verification code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      console.log('🔍 Verifying code:', code);

      // Call your existing verify-email Edge Function
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/verify-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Verification failed: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      console.log('✅ Verification successful:', result);

      // Show success message
      showToast.success('Email verified successfully!');

      // Refresh user data to get updated verification status
      await refreshUser();

      // Redirect to payment page (users must pay before accessing dashboard)
      navigate('/payment', { replace: true });

    } catch (error: any) {
      console.error('❌ Verification error:', error);
      const errorMessage = error.message || 'Verification failed. Please try again.';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!userEmail || !userId) {
      setError('Missing user information. Please register again.');
      return;
    }

    setIsResending(true);
    setError('');

    try {
      console.log('🔄 Resending verification code...');

      // Call your existing send-verification-email Edge Function
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userEmail,
          userId: userId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send verification email');
      }

      console.log('✅ Verification code resent successfully');
      showToast.success('Verification code sent! Please check your email.');

    } catch (error: any) {
      console.error('❌ Resend error:', error);
      const errorMessage = error.message || 'Failed to resend verification code';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 w-full max-w-md mx-auto'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 w-full max-w-md mx-auto';

  return (
    <div className={bgClass}>
      <div className={cardClass}>
        <div className="text-center">
          {/* Header */}
          <div className="mb-6">
            <div className={`w-20 h-20 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Verify Your Email
            </h1>
            <p className="text-lg text-white/80">
              Enter the 6-character code we sent to your email
            </p>
          </div>

          {/* Email Display */}
          <div className="mb-6">
            <div className={`${theme === 'professional' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-purple-500/10 border-purple-500/30'} rounded-lg p-3 border mb-4`}>
              <p className={`${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'} font-medium break-all`}>
                {userEmail}
              </p>
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label htmlFor="code" className="sr-only">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                placeholder="Enter 6-character code"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (value.length <= 6) {
                    setCode(value);
                    setError('');
                  }
                }}
                className={`w-full px-4 py-4 ${theme === 'professional' 
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500' 
                  : 'bg-white/10 border-white/20 text-white focus:border-purple-500'
                } border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 text-center text-xl font-mono tracking-widest`}
                maxLength={6}
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-white/60 text-sm mt-2">
                Format: 4 digits + 2 letters (e.g. 1234AB)
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || code.length !== 6}
              className={`w-full ${theme === 'professional' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600' 
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'} 
                text-white py-4 px-4 rounded-xl font-medium shadow-lg 
                focus:outline-none focus:ring-2 ${theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'} 
                focus:ring-offset-2 focus:ring-offset-transparent 
                transition-all duration-300 transform hover:scale-105 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                flex items-center justify-center space-x-3`}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Verify Email</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/70 text-sm mb-4">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendCode}
              disabled={isResending}
              className={`${theme === 'professional' 
                ? 'text-cyan-400 hover:text-cyan-300' 
                : 'text-purple-400 hover:text-purple-300'} 
                font-medium transition-colors duration-300 flex items-center justify-center space-x-2 mx-auto
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend Code</span>
                </>
              )}
            </button>
          </div>

          {/* Troubleshooting */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <details className="text-left">
              <summary className="text-white/70 text-sm cursor-pointer hover:text-white transition-colors">
                Troubleshooting tips
              </summary>
              <ul className="text-white/60 text-xs space-y-2 mt-3 ml-4">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure the code hasn't expired (15 minutes)</li>
                <li>• Try refreshing this page and requesting a new code</li>
                <li>• Contact support if the issue persists</li>
              </ul>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
