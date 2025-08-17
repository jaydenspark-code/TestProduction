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
        console.log('🔍 SIMPLE OAUTH CALLBACK - Starting...');
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ OAuth session error:', error);
          setStatus('error');
          setMessage(`Authentication failed: ${error.message}`);
          return;
        }

        if (!data.session?.user) {
          setStatus('error');
          setMessage('No valid Google session found.');
          return;
        }

        const authUser = data.session.user;
        console.log('✅ Google OAuth user authenticated:', authUser.email);

        // SIMPLE APPROACH: Just insert with minimal data and let database handle conflicts
        const simpleUserData = {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Google User',
          is_verified: true,
          is_paid: false,
          country: 'US',
          currency: 'USD',
          role: 'user',
          referral_code: 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          referred_by: searchParams.get('ref') || null
        };

        console.log('🔧 SIMPLE INSERT - Attempting with data:', simpleUserData);

        // Try direct insert first
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert([simpleUserData])
          .select()
          .single();

        if (insertError) {
          console.log('⚠️ INSERT FAILED (expected for existing users):', insertError.message);
          
          // If insert fails, try update by email
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              full_name: simpleUserData.full_name,
              is_verified: true,
              updated_at: new Date().toISOString()
            })
            .eq('email', authUser.email)
            .select()
            .single();

          if (updateError) {
            console.error('❌ BOTH INSERT AND UPDATE FAILED:', updateError);
            console.error('❌ This should not happen - check RLS policies');
            setStatus('error');
            setMessage('Failed to save your profile. Please contact support.');
            return;
          }

          console.log('✅ UPDATED existing user by email:', updatedUser.email);
        } else {
          console.log('✅ INSERTED new user:', insertedUser.email);
        }

        // Verify user exists now
        const { data: verifyUser, error: verifyError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (verifyError || !verifyUser) {
          console.error('❌ VERIFICATION FAILED - User still missing after insert/update');
          setStatus('error');
          setMessage('Profile verification failed. Please try again.');
          return;
        }

        console.log('✅ VERIFICATION SUCCESS - User exists:', verifyUser.email);
        
        await refreshUser();
        setStatus('success');
        setMessage('Google authentication successful! Redirecting...');
        showToast.success('Welcome! Redirecting to payment...');
        
        setTimeout(() => {
          navigate('/payment', {
            replace: true,
            state: {
              fromOAuth: true,
              provider: 'google',
              email: authUser.email,
              verified: true
            }
          });
        }, 1500);

      } catch (error) {
        console.error('❌ CALLBACK EXCEPTION:', error);
        setStatus('error');
        setMessage('An unexpected error occurred.');
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

        {/* Debug info */}
        <div className="mt-4 p-2 bg-black/20 rounded text-xs text-left">
          <div>Status: {status}</div>
          <div>Check browser console for detailed logs</div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
