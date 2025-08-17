// Fixed registration function to use real Supabase authentication after RLS fix
const register = async (userData: Partial<User> & { password: string; email: string }): Promise<{ success: boolean; error?: string }> => {
  console.log('🎯 AuthContext register function called with fixed RLS policies!');
  console.log('📝 Registration data received:', userData);
  
  setLoading(true);
  
  try {
    if (!supabase) {
      console.error('❌ Supabase client not available');
      setLoading(false);
      return { success: false, error: 'Authentication service unavailable' };
    }

    // Validate required fields
    if (!userData.email) {
      return { success: false, error: 'Email is required' };
    }
    if (!userData.fullName) {
      return { success: false, error: 'Full name is required' };
    }
    if (!userData.country) {
      return { success: false, error: 'Country is required' };
    }

    console.log('📝 Starting REAL Supabase registration for:', userData.email);

    // Generate referral code
    const referralCode = `USR${Date.now().toString(36).toUpperCase()}`;
    
    // Use regular Supabase auth.signUp (RLS policies now allow this)
    console.log('🔄 Creating user with Supabase auth...');
    
    const { data, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
          country: userData.country,
          currency: userData.currency || 'USD',
          referral_code: referralCode,
          phone: userData.phoneNumber
        }
      }
    });

    if (authError) {
      console.error('❌ Supabase auth signup error:', authError);
      
      if (authError.message.includes('already registered')) {
        return { success: false, error: 'This email is already registered. Please try logging in instead.' };
      }
      
      return { success: false, error: authError.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user account' };
    }

    console.log('✅ User created in Supabase auth:', data.user.id);

    // The user record will be created automatically by the database trigger
    // Send custom verification email via our SendGrid integration
    try {
      console.log('📧 Sending custom verification email...');
      
      // Generate verification code
      const generateVerificationCode = () => {
        const digits = '0123456789';
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        let code = '';
        for (let i = 0; i < 4; i++) {
          code += digits[Math.floor(Math.random() * digits.length)];
        }
        
        for (let i = 0; i < 2; i++) {
          code += letters[Math.floor(Math.random() * letters.length)];
        }
        
        return code.split('').sort(() => Math.random() - 0.5).join('');
      };

      const verificationCode = generateVerificationCode();
      
      // Store verification code in database
      const { error: tokenError } = await supabase
        .from('email_verification_tokens')
        .insert({
          email: userData.email,
          token: verificationCode,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });

      if (tokenError) {
        console.warn('⚠️ Could not store verification token:', tokenError);
      }

      // Send email via our API endpoint
      const emailResponse = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          verificationToken: verificationCode,
          name: userData.fullName
        })
      });

      if (!emailResponse.ok) {
        console.warn('⚠️ Email sending failed, but registration successful');
      } else {
        console.log('✅ Verification email sent successfully');
      }

    } catch (emailError) {
      console.warn('⚠️ Email sending error, but registration successful:', emailError);
    }

    // Create user object for local state
    const newUser: User = {
      id: data.user.id,
      email: userData.email,
      fullName: userData.fullName,
      country: userData.country,
      currency: userData.currency || 'USD',
      referralCode: referralCode,
      phoneNumber: userData.phoneNumber,
      isVerified: false,
      isPaidUser: false,
      role: 'user',
      isAdvertiser: false,
      isAgent: false,
      createdAt: new Date(),
    };

    // Don't set user in state yet - they need to verify email first
    console.log('✅ Registration successful! User needs to verify email.');
    
    setLoading(false);
    return { success: true };

  } catch (error: any) {
    console.error('❌ Registration error:', error);
    setLoading(false);
    return { success: false, error: error.message || 'Registration failed. Please try again.' };
  }
};
