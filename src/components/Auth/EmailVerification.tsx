import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleResendEmail = async (emailToVerify?: string) => {
    const email = emailToVerify || user?.email;
    if (!email) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setVerifying(true);
    setEmailError('');
    try {
      console.log('Attempting to resend verification email to:', email);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) {
        console.error('Supabase resend error:', error);
        throw error;
      }
      
      console.log('Verification email resent successfully');
      setShowEmailDialog(false);
      toast.success('Verification email has been resent. Please check your inbox and spam folder.');
    } catch (error) {
      console.error('Error resending email:', error);
      const errorMessage = error.message || 'Failed to send verification email';
      setEmailError(`${errorMessage}. Please try again or contact support if the issue persists.`);
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleEmailConfirmation = async (token: string) => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) throw error;

      if (data.user) {
        await refreshUser();
        setVerificationStatus('success');
        
        setTimeout(() => {
          navigate('/payment');
        }, 2000);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleEmailConfirmation(token);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
          <p className="text-gray-300">
            We've sent a verification link to your email address.
            Please check your inbox (and spam folder) to complete your registration.
          </p>
        </div>

        {user?.email && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          {/* Email Re-entry Dialog */}
          {showEmailDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold text-white mb-4">Re-enter Your Email</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Enter your email address"
                  />
                  {emailError && (
                    <p className="text-red-500 text-sm mt-2">{emailError}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEmailDialog(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResendEmail(emailInput)}
                    disabled={verifying}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? 'Sending...' : 'Send Verification'}
                  </button>
                </div>
              </div>
            </div>
          )}
        )}

        <button
          onClick={() => setShowEmailDialog(true)}
          disabled={verifying}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-4"
        >
          {verifying ? 'Sending...' : '📧 Resend Verification Email'}
        </button>

        <p className="text-sm text-gray-400 text-center">
          Didn't receive the email? Check your spam folder or try resending.
        </p>
      </div>
    </div>
  );
}
