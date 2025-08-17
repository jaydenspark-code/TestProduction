

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Google authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔍 Processing Google OAuth callback...');
        setStatus('loading');
        setMessage('Verifying your Google account...');

        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ OAuth session error:', error);
          setStatus('error');
          setMessage(`Authentication failed: ${error.message}`);
          showToast.error('Google authentication failed');
          return;
        }

        if (data.session?.user) {
          console.log('✅ Google OAuth user authenticated:', data.session.user.email);
          
          // Extract user data from Google OAuth
          const authUser = data.session.user;

          try {
            // Check if user already exists by ID first, then by email
            const { data: existingUserById, error: checkByIdError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();

            if (checkByIdError && checkByIdError.code !== 'PGRST116') {
              console.error('❌ Error checking user by ID:', checkByIdError);
              throw checkByIdError;
            }

            // Check if user exists by email (for cases where ID might be different)
            const { data: existingUserByEmail, error: checkByEmailError } = await supabase
              .from('users')
              .select('*')
              .eq('email', authUser.email)
              .single();

            if (checkByEmailError && checkByEmailError.code !== 'PGRST116') {
              console.error('❌ Error checking user by email:', checkByEmailError);
              throw checkByEmailError;
            }

            // Create user profile data for Google OAuth user
            const userData = {
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Google User',
              is_verified: true, // Google emails are already verified
              is_paid: false, // Still needs to pay for activation
              country: 'US', // Default, can be updated later
              currency: 'USD',
              role: 'user',
              referral_code: 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase(),
              referred_by: searchParams.get('ref') || null,
              updated_at: new Date().toISOString()
            };

            console.log('🔧 User check results:', {
              existingById: !!existingUserById,
              existingByEmail: !!existingUserByEmail,
              authUserId: authUser.id,
              authUserEmail: authUser.email
            });

            let result;

            if (existingUserById) {
              // User exists with same ID - update
              console.log('✅ User exists with same ID, updating...');
              const updateData = {
                full_name: userData.full_name,
                is_verified: true,
                updated_at: userData.updated_at
              };
              
              const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', authUser.id)
                .select()
                .single();

              if (updateError) {
                console.error('❌ Error updating existing user:', updateError);
                throw updateError;
              }
              result = updatedUser;

            } else if (existingUserByEmail) {
              // User exists with same email but different ID - this is a conflict
              console.log('⚠️ User exists with same email but different ID');
              
              // Update the existing user's ID to match the auth user ID
              const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update({
                  id: authUser.id,
                  full_name: userData.full_name,
                  is_verified: true,
                  updated_at: userData.updated_at
                })
                .eq('email', authUser.email)
                .select()
                .single();

              if (updateError) {
                console.error('❌ Error updating user ID:', updateError);
                // If ID update fails, try to link the existing user
                setStatus('success');
                setMessage('Your account has been linked successfully!');
                result = existingUserByEmail;
              } else {
                result = updatedUser;
              }

            } else {
              // New user - insert
              console.log('✅ New user, inserting...');
              const { data: insertedUser, error: insertError } = await supabase
                .from('users')
                .insert([userData])
                .select()
                .single();

              if (insertError) {
                console.error('❌ Error inserting new user:', insertError);
                console.error('❌ Error details:', JSON.stringify(insertError, null, 2));
                throw insertError;
              }
              result = insertedUser;
            }

            console.log('✅ Google user profile handled successfully:', result.email);
            
            // Refresh user data in context
            await refreshUser();

            setStatus('success');
            setMessage('Google authentication successful! Redirecting to payment...');
            showToast.success('Welcome! Redirecting to complete your activation...');
            
            // Redirect to payment page with OAuth context
            setTimeout(() => {
              navigate('/payment', {
                replace: true,
                state: {
                  fromOAuth: true,
                  provider: 'google',
                  email: authUser.email,
                  verified: true,
                  message: 'Welcome! Complete payment to activate your account and start earning.'
                }
              });
            }, 1500);

          } catch (err) {
            console.error('❌ Exception during user profile creation:', err);
            setStatus('error');
            setMessage('Unexpected error saving your profile.');
            showToast.error('An unexpected error occurred');
          }
        } else {
          setStatus('error');
          setMessage('No valid Google session found. Please try signing in again.');
          showToast.error('Authentication session not found');
        }
      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during authentication.');
        showToast.error('Authentication failed');
      }
    };

    handleOAuthCallback();
  }, [navigate, refreshUser, searchParams]);

  const handleRetry = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          )}
          {status === 'success' && (
            <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          {status === 'loading' && 'Processing...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Error'}
        </h1>
        
        <p className="text-white/80 mb-6">{message}</p>
        
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;


















