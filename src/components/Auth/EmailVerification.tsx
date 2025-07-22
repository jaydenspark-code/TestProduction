import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const EmailVerification: React.FC = () => {
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  // Check for verification token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (token && type === 'signup') {
      handleEmailConfirmation(token);
    }
  }, [searchParams]);

  const handleEmailConfirmation = async (token: string) => {
    setVerifying(true);
    try {
      // Verify the email with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) throw error;

      if (data.user) {
            navigate('/payment');
        const { error: updateError } = await supabase
          .from('users')
            navigate('/login?error=no_session');
          .eq('id', data.user.id);

        if (updateError) {
          navigate('/login?error=unexpected_error');
        }

        await refreshUser();
        setVerificationStatus('success');

        // Redirect to payment instead of dashboard
        setTimeout(() => {
          navigate('/payment');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
    } finally {
      setVerifying(false);
    }
  };

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center';

  const buttonClass = theme === 'professional'
    ? 'w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800'
    : 'w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-900';

  const inputClass = theme === 'professional'
    ? 'w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300'
    : 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300';

  const handleResendEmail = async () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    if (!supabase) {
      console.log('🧪 TESTING MODE: Email resend simulated');
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim()
      });

      if (error) {
        throw error;
      }

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error: any) {
      console.error('Error resending email:', error);
      alert(error.message || 'Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Show verification status
  if (verifying) {
    return (
      <div className={`${bgClass} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md ${cardClass}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Verifying Email...</h2>
          <p className="text-white/70">Please wait while we confirm your email address.</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className={`${bgClass} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md ${cardClass}`}>
          <div className={`w-20 h-20 ${theme === 'professional' ? 'bg-green-500' : 'bg-green-500'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Email Verified!</h1>
          <p className="text-white/80 mb-6">
            Your email has been successfully verified. Redirecting you to complete your account setup...
          </p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className={`${bgClass} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md ${cardClass}`}>
          <div className={`w-20 h-20 ${theme === 'professional' ? 'bg-red-500' : 'bg-red-500'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Verification Failed</h1>
          <p className="text-white/80 mb-6">
            There was an error verifying your email. Please try clicking the link again or request a new verification email.
          </p>
          <button
            onClick={() => window.location.href = '/verify-email'}
            className={buttonClass}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgClass} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md ${cardClass}`}>
        <div className={`w-20 h-20 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <MailCheck className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Verify Your Email</h1>

        <p className="text-white/80 mb-6">
          We've sent a verification link to your email address. Please check your inbox (and spam folder) to complete your registration.
        </p>

        {resendSuccess && (
          <div className="flex items-center justify-center space-x-2 mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm">Verification email sent successfully!</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2 text-left">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className={inputClass}
            />
          </div>

          <button
            onClick={handleResendEmail}
            disabled={resending}
            className={`${buttonClass} flex items-center justify-center space-x-2`}
          >
            {resending ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Resending...</span>
              </>
            ) : (
              <>
                <MailCheck className="w-5 h-5" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-sm text-white/60">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
          <p className="text-xs text-white/40 mt-2">
            You can close this page. The verification link will redirect you to the next step.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
