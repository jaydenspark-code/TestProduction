import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authEmailService } from '../../services/authEmailService';
import { Mail, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token && email) {
      handleEmailVerification();
    }
  }, [token, email]);

  const handleEmailVerification = async () => {
    if (!token || !email) return;

    setStatus('verifying');
    setMessage('Verifying your email address...');

    try {
      const result = await authEmailService.verifyEmailToken(token, email);
      
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Email verified successfully!');
        
        // Refresh user data to get updated verification status
        await refreshUser();
        
        // Redirect to payment after a short delay
        setTimeout(() => {
          navigate('/payment', { replace: true });
        }, 2000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Email verification failed');
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred during verification');
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email) {
      setMessage('No email address found. Please try registering again.');
      return;
    }

    setResending(true);
    
    try {
      const result = await authEmailService.resendVerificationEmail(user.email);
      
      if (result.success) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage((result as any).error || 'Failed to resend verification email');
      }
    } catch (error: any) {
      console.error('Resend email error:', error);
      setMessage('Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20';

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-400" />;
      default:
        return <Mail className="w-8 h-8 text-white" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-300';
      case 'error':
        return 'text-red-300';
      case 'verifying':
        return 'text-blue-300';
      default:
        return 'text-white';
    }
  };

  return (
    <div className={bgClass}>
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          <div className={cardClass}>
            <div className="text-center mb-8">
              <div className={`w-16 h-16 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                {getStatusIcon()}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Email Verification</h1>
              <p className="text-white/70">Complete your account setup</p>
            </div>

            <div className="space-y-6">
              {token && email ? (
                // Verification in progress or completed
                <div className="text-center">
                  <div className={`p-6 rounded-lg border ${
                    status === 'success' 
                      ? 'bg-green-500/20 border-green-500/50' 
                      : status === 'error'
                      ? 'bg-red-500/20 border-red-500/50'
                      : 'bg-blue-500/20 border-blue-500/50'
                  }`}>
                    <p className={`text-lg font-medium ${getStatusColor()}`}>
                      {message}
                    </p>
                    
                    {status === 'success' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-center space-x-2 text-green-300">
                          <CheckCircle className="w-5 h-5" />
                          <span>Redirecting to payment...</span>
                        </div>
                      </div>
                    )}
                    
                    {status === 'error' && (
                      <div className="mt-4 space-y-3">
                        <p className="text-white/70 text-sm">
                          The verification link may have expired or been used already.
                        </p>
                        <button
                          onClick={handleResendEmail}
                          disabled={resending}
                          className={`w-full ${theme === 'professional' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 ${theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'} focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                        >
                          {resending ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-5 h-5" />
                              <span>Resend Verification Email</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Waiting for email verification
                <div className="text-center">
                  <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-6 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
                    <h3 className="text-white font-medium mb-4 flex items-center justify-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Check Your Email
                    </h3>
                    <p className="text-white/70 mb-4">
                      We've sent a verification email to:
                    </p>
                    <p className={`${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'} font-medium mb-6`}>
                      {user?.email || 'your email address'}
                    </p>
                    <p className="text-white/60 text-sm mb-6">
                      Please check your inbox (and spam folder) and click the verification link to continue.
                    </p>
                    
                    <button
                      onClick={handleResendEmail}
                      disabled={resending}
                      className={`w-full ${theme === 'professional' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 ${theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'} focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                    >
                      {resending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          <span>Resend Email</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'} mt-4`}>
                    <h4 className="text-white font-medium mb-2">📧 Email Not Received?</h4>
                    <ul className="text-white/70 text-sm space-y-1 text-left">
                      <li>• Check your spam/junk folder</li>
                      <li>• Make sure {user?.email || 'your email'} is correct</li>
                      <li>• Wait a few minutes for delivery</li>
                      <li>• Click "Resend Email" if needed</li>
                    </ul>
                  </div>
                </div>
              )}

              {message && !token && (
                <div className={`p-4 rounded-lg border ${
                  message.includes('sent') 
                    ? 'bg-green-500/20 border-green-500/50 text-green-200' 
                    : 'bg-red-500/20 border-red-500/50 text-red-200'
                }`}>
                  <p className="text-sm">{message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;