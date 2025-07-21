import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔍 Starting callback with URL:', window.location.href);
        
        // Handle both token hash and search params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = searchParams.get('token') || hashParams.get('access_token');
        const type = searchParams.get('type') || 'signup';
        
        if (token) {
          console.log('📧 Verifying token...');
          
          // Try session exchange first
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          
          if (error) {
            console.error('❌ Session exchange error:', error);
            setVerificationStatus('error');
            return;
          }

          if (data.session?.user) {
            await refreshUser();
            navigate('/payment/setup', { replace: true });
          }
        }
      } catch (error: any) {
        console.error('💥 Callback error:', error);
        setVerificationStatus('error');
      }
    };

    handleCallback();
  }, []); // Empty dependency array to run only once

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p className="text-sm">Verifying your account...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

















