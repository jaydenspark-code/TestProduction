import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Mail, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const redirectTo = searchParams.get('redirect_to');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  useEffect(() => {
    if (accessToken && refreshToken) {
      console.log('🔗 Supabase verification tokens found in URL');
      handleEmailVerification();
    } else if (tokenHash && type) {
      console.log('🔗 Supabase token hash found in URL');
      handleTokenHashVerification();
    }
  }, [accessToken, refreshToken, tokenHash, type]);

  // Check if user is already verified and redirect appropriately
  useEffect(() => {
    if (user?.isVerified) {
      console.log('👤 User is already verified, redirecting to payment...');
      navigate('/payment', { replace: true });
    }
  }, [user?.isVerified, navigate]);

  const handleTokenHashVerification = async () => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    
    if (!tokenHash || type !== 'email') return;

    setStatus('verifying');
    setMessage('Verifying your email address...');

    try {
      console.log('🔧 Verifying email with token hash...');
      
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'email'
      });

      if (error) {
        throw error;
      }

      console.log('✅ Email verification successful:', data.user?.email);

      setStatus('success');
      setMessage('Email verified successfully!');

      // Refresh user data
      await refreshUser();

      // Redirect to payment page
      console.log('🚀 Redirecting to payment page...');
      setTimeout(() => {
        navigate('/payment', { replace: true });
      }, 1500);
      
    } catch (error: any) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage('Email verification failed. The link may have expired.');
    }
  };

  const handleEmailVerification = async () => {
    if (!accessToken) return;

    setStatus('verifying');
    setMessage('Verifying your email address...');

    try {
      // Supabase native session from URL
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        throw error;
      }

      console.log('✅ Session set successfully');

      // Get the current user after setting session
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !authUser) {
        throw new Error('Failed to get user after session setup');
      }

      console.log('👤 Current user:', authUser.email, 'Email confirmed:', !!authUser.email_confirmed_at);

      // If email is confirmed, ensure the profile is updated
      if (authUser.email_confirmed_at) {
        console.log('🔧 Email confirmed, updating profile verification status...');
        
        // Update the user profile verification status in the database
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            is_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', authUser.id);

        if (updateError) {
          console.error('⚠️ Profile update error:', updateError);
          // Don't fail the verification if profile update fails
        } else {
          console.log('✅ Profile verification status updated');
        }
      }

      setStatus('success');
      setMessage('Email verified successfully!');

      // Refresh user data to get updated verification status
      console.log('🔄 Refreshing user context...');
      await refreshUser();

      // Small delay to ensure context updates
      setTimeout(async () => {
        // Double-check by refreshing again
        await refreshUser();
        console.log('🚀 Redirecting to payment page...');
        navigate('/payment', { replace: true });
      }, 1500);
      
    } catch (error: any) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred during verification');
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      // Try multiple sources to get the email
      const userEmail = user?.email || 
                        searchParams.get('email') || 
                        localStorage.getItem('registrationEmail') || 
                        sessionStorage.getItem('registrationEmail');
      
      const fullName = user?.fullName || 
                       localStorage.getItem('registrationFullName') || 
                       sessionStorage.getItem('registrationFullName') || 
                       'User';
      
      if (!userEmail) {
        setStatus('error');
        setMessage('No email address found. Please try registering again.');
        return;
      }

      console.log('🔄 Resending verification email via standalone service...');
      
      // Use our standalone email service instead of Supabase's resend
      const { authEmailService } = await import('../../services/authEmailService-standalone');
      const result = await authEmailService.resendVerificationEmail(userEmail, fullName);

      if (result.success) {
        setMessage(`Verification email sent to ${userEmail}. Please check your inbox and spam folder.`);
        setStatus('pending');
        console.log('✅ Verification email resent successfully via standalone service');
      } else {
        throw new Error(result.error || 'Failed to resend verification email');
      }
      
    } catch (error: any) {
      console.error('❌ Error resending verification email:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 w-full max-w-md mx-auto'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 w-full max-w-md mx-auto';

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

  const userEmailDisplay = user?.email || localStorage.getItem('registrationEmail') || 'your email address';

  return (
    <div className={bgClass}>
      <div className={cardClass}>
        <div className="text-center">
          <div className="mb-6">
            <div className={`w-20 h-20 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform duration-200`}>
              {getStatusIcon()}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Email Verification</h1>
            <p className="text-lg text-white/80">Complete your account setup</p>
          </div>

          <div className="space-y-6 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-inner">
            {accessToken && refreshToken ? (
              // Verification in progress or completed
              <div className="text-center">
                <div className={`p-6 rounded-xl border backdrop-blur-md ${
                  status === 'success' 
                    ? 'bg-green-500/10 border-green-500/30 shadow-green-500/20' 
                    : status === 'error'
                    ? 'bg-red-500/10 border-red-500/30 shadow-red-500/20'
                    : 'bg-blue-500/10 border-blue-500/30 shadow-blue-500/20'
                } shadow-lg`}>
                  <p className={`text-lg font-medium mb-3 ${getStatusColor()}`}>
                    {message}
                  </p>
                  
                  {status === 'success' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-center space-x-2 text-green-300 bg-green-500/10 rounded-lg p-3">
                        <CheckCircle className="w-5 h-5" />
                        <span>Redirecting to payment...</span>
                      </div>
                    </div>
                  )}
                  
                  {status === 'error' && (
                    <div className="mt-4 space-y-4">
                      <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                        <p className="text-white/80 text-sm leading-relaxed">
                          The verification link may have expired or been used already. Please request a new verification email.
                        </p>
                      </div>
                      <button
                        onClick={handleResendEmail}
                        disabled={resending}
                        className={`w-full ${theme === 'professional' 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600' 
                          : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'} 
                          text-white py-3.5 px-4 rounded-xl font-medium shadow-lg 
                          focus:outline-none focus:ring-2 ${theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'} 
                          focus:ring-offset-2 focus:ring-offset-transparent 
                          transition-all duration-300 transform hover:scale-105 
                          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                          flex items-center justify-center space-x-3`}
                      >
                        {resending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Sending verification email...</span>
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
              <div className="text-center space-y-6">
                <div className={`backdrop-blur-md rounded-xl p-8 border ${theme === 'professional' ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white/5 border-white/10'} shadow-lg`}>
                  <div className="flex flex-col items-center space-y-4">
                    <div className={`w-16 h-16 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'} rounded-xl flex items-center justify-center mb-2`}>
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white">Check Your Email</h3>
                    <div className="w-full max-w-sm">
                      <p className="text-white/80 text-lg mb-3">
                        We have sent a verification email to:
                      </p>
                      <div className={`${theme === 'professional' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-purple-500/10 border-purple-500/30'} rounded-lg p-3 border mb-4`}>
                        <p className={`${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'} font-medium text-lg break-all`}>
                          {userEmailDisplay}
                        </p>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed mb-6">
                        Please check your inbox and click the verification link to continue. The link will expire in 24 hours.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleResendEmail}
                      disabled={resending}
                      className={`w-full max-w-sm ${theme === 'professional' 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'} 
                        text-white py-3.5 px-4 rounded-xl font-medium shadow-lg 
                        focus:outline-none focus:ring-2 ${theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'} 
                        focus:ring-offset-2 focus:ring-offset-transparent 
                        transition-all duration-300 transform hover:scale-105 
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                        flex items-center justify-center space-x-3`}
                    >
                      {resending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Sending verification email...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          <span>Resend Verification Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className={`backdrop-blur-md rounded-xl p-6 border ${theme === 'professional' ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white/5 border-white/10'} shadow-lg`}>
                  <h4 className="text-white font-medium mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
                    Troubleshooting Tips
                  </h4>
                  <ul className="text-white/80 text-sm space-y-3">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Check your spam or junk folder</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Verify that your email address is correct</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Allow a few minutes for the email to arrive</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Click the resend button if needed</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {message && !accessToken && (
              <div className={`mt-4 p-4 rounded-xl backdrop-blur-sm border ${
                message.includes('sent') 
                  ? 'bg-green-500/10 border-green-500/30 text-green-200' 
                  : 'bg-red-500/10 border-red-500/30 text-red-200'
              } shadow-lg transition-all duration-300`}>
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

