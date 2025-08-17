import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import { useAuth } from '../context/AuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 Processing OAuth callback...');
        
        // Get referral code from URL if present
        const referralCode = searchParams.get('ref');
        
        // Handle OAuth flow
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ OAuth callback error:', error);
          setStatus('error');
          setMessage(`Authentication failed: ${error.message}`);
          return;
        }

        if (data.session?.user) {
          console.log('✅ OAuth user authenticated:', data.session.user.email);
          
          // Check if this user exists in our database
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', data.session.user.email)
            .single();

          if (!existingUser) {
            console.log('🆕 New user from OAuth, creating profile...');
            
            // Create new user profile for OAuth user
            const userData = {
              id: data.session.user.id,
              email: data.session.user.email,
              full_name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || 'OAuth User',
              username: data.session.user.email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5),
              is_verified: true, // OAuth emails are already verified
              is_paid_user: false, // Still needs to pay for activation
              country: 'US', // Default, can be updated later
              currency: 'USD',
              role: 'user',
              referred_by: referralCode || null,
              created_at: new Date().toISOString()
            };

            const { error: insertError } = await supabase
              .from('users')
              .insert([userData]);

            if (insertError) {
              console.error('❌ Error creating user profile:', insertError);
            }
          } else {
            console.log('👤 Existing OAuth user, updating verification status...');
            
            // Update verification status for existing user
            await supabase
              .from('users')
              .update({ is_verified: true })
              .eq('id', data.session.user.id);
          }

          // Refresh user data in context
          await refreshUser();

          setStatus('success');
          setMessage('Google authentication successful! Redirecting to payment...');
          // Redirect to payment page
          navigate('/payment', { 
            state: { 
              fromOAuth: true, 
              email: data.session.user.email,
              verified: true,
              provider: 'google'
            } 
          });
          
        } else {
          setStatus('error');
          setMessage('No valid session found. Please try signing in again.');
        }
      } catch (error) {
        console.error('❌ Auth callback error:', error);
  setStatus('error');
  setMessage('An unexpected error occurred during authentication. Please try again or contact support.');
  // Optionally, log error to a monitoring service here
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, refreshUser]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        );
      case 'success':
        return (
          <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          {status === 'loading' && 'Verifying...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Error'}
        </h1>
        
        <p className="text-white/80 mb-6">
          {message}
        </p>

        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth/login')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => navigate('/auth/register')}
              className="w-full bg-transparent text-white py-2 px-4 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
            >
              Register New Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
