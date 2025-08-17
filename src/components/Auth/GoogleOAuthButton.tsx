import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';

interface GoogleOAuthButtonProps {
  mode: 'login' | 'register';
  disabled?: boolean;
  className?: string;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({ 
  mode, 
  disabled = false, 
  className = '' 
}) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    if (!supabase) {
      showToast.error('Authentication service unavailable');
      return;
    }

    setLoading(true);
    
    try {
      console.log(`🔍 Starting Google OAuth ${mode}...`);
      
      // Determine redirect URL based on environment
      const isDevelopment = window.location.hostname === 'localhost';
      const redirectUrl = isDevelopment 
        ? (import.meta.env.VITE_DEV_OAUTH_REDIRECT_URL || `${window.location.origin}/auth/callback`)
        : (import.meta.env.VITE_OAUTH_REDIRECT_URL || `${window.location.origin}/auth/callback`);
      
      console.log('🔗 OAuth redirect URL:', redirectUrl);
      console.log('🏠 Development mode:', isDevelopment);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        showToast.error(`Google ${mode} failed. Please try again.`);
      } else {
        console.log('✅ Google OAuth initiated successfully');
        showToast.success(`Redirecting to Google for ${mode}...`);
        // The redirect will happen automatically
      }
    } catch (err: any) {
      console.error('❌ Unexpected Google OAuth error:', err);
      showToast.error(`An unexpected error occurred during Google ${mode}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={disabled || loading}
      className={`w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed ${loading ? 'opacity-60' : ''} ${className}`}
    >
      <Mail className="w-5 h-5" />
      <span className="font-medium">
        {loading 
          ? 'Connecting...' 
          : `Continue with Google`
        }
      </span>
    </button>
  );
};

export default GoogleOAuthButton;
