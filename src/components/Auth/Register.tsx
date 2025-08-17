import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ChevronDown, Phone } from 'lucide-react';
import { formatDualCurrencySync } from '../../utils/currency';
import 'react-phone-number-input/style.css';
import { getAllCountries, detectUserCountry } from '../../utils/countries';
import GoogleOAuthButton from './GoogleOAuthButton';

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: detectUserCountry(),
    phoneNumber: '',
    referredBy: referralCode || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
      }
      .animate-fade-out {
        animation: fadeOut 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Monitor success state changes
  useEffect(() => {
    console.log('🔄 Success state changed to:', success);
  }, [success]);

  const countries = getAllCountries();
  const selectedCountry = countries.find(c => c.code === formData.country);
  const activationFeeUSD = 15.00;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountrySelect = (countryCode: string) => {
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      phoneNumber: ''
    }));
    setShowCountryDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🎯 handleSubmit called!'); // This should appear first
    console.log('🔍 Event object:', e);
    console.log('🔍 Event type:', e.type);
    
    e.preventDefault();
    
    console.log('🚀 Default prevented, continuing with custom logic');
    
    // Validate form data
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    console.log('🚀 Starting registration process...');

    // Add detailed logging
    console.log('📝 Form data:', {
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      email: formData.email,
      country: formData.country,
      phoneNumber: formData.phoneNumber,
      referredBy: formData.referredBy
    });

    // Enhanced form validation
    const validationErrors = [];
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      validationErrors.push('Please enter your full name');
    }
    if (!formData.email.trim()) {
      validationErrors.push('Please enter your email address');
    }
    if (!formData.password) {
      validationErrors.push('Please enter a password');
    } else if (formData.password.length < 8) {
      validationErrors.push('Password must be at least 8 characters long');
    }
    if (formData.password !== formData.confirmPassword) {
      validationErrors.push('Passwords do not match');
    }
    
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      setLoading(false);
      return;
    }

    try {
      setError('');
      console.log('📝 Preparing registration data...');
      const selectedCountry = countries.find(c => c.code === formData.country);
      const currency = selectedCountry?.currency || 'USD';
      const registrationData = {
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`,
        currency,
        role: 'user' as const
      };

      console.log('📧 Calling register function with data:', registrationData);
      const result = await register(registrationData);
      console.log('📋 Registration result:', result);

      if (result.success) {
        console.log('✅ Registration successful, preparing to redirect...');
        setSuccess(true);
        setLoading(false);
        
        // Show success message before redirecting
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        successMessage.textContent = 'Account created successfully! Redirecting to verification...';
        document.body.appendChild(successMessage);

        // Add success message cleanup
        setTimeout(() => {
          document.body.removeChild(successMessage);
          navigate('/verify-email');
        }, 2000);
      } else {
        console.error('❌ Registration failed:', result.error);
        setError(result.error || 'Registration failed. Please try again.');
        setLoading(false);
        // Scroll to error message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('💥 Unexpected error during registration:', err);
      const errorMessage = err?.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      console.log('🏁 Registration process completed, clearing loading state');
      if (!success) {
        setLoading(false);
      }
    }
  };

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20';

  const inputClass = theme === 'professional'
    ? 'w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/20'
    : 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/20';

  const inputWithIconClass = theme === 'professional'
    ? 'w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/20'
    : 'w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/20';

  return (
    <div className={bgClass}>
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Header Section - Like in image 2 */}
          <div className="text-center mb-6">
            <div className="flex justify-center space-x-4 mb-6">
              <button className="px-8 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium">
                Register
              </button>
              <Link
                to="/login"
                className="px-8 py-2 bg-white/10 text-white/70 rounded-lg font-medium hover:bg-white/20 transition-all duration-200"
              >
                Login
              </Link>
            </div>
          </div>

          <div className={cardClass}>
            <div className="text-center mb-8">
              <div className={`w-16 h-16 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">EarnPro</h1>
              <p className="text-white/70">Multi-Level Referral System</p>
              {referralCode && (
                <p className={`${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'} text-sm mt-2`}>
                  Referred by: {referralCode}
                </p>
              )}
            </div>

            {success ? (
              // Show success message when registration is successful
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-green-300 font-semibold text-lg">Registration Successful!</h3>
                </div>
                <p className="text-white/80 text-base mb-6">
                  We've sent a verification email to <strong className="text-white">{formData.email}</strong>.
                  Please check your inbox (and spam folder) and click the verification link to continue.
                </p>
                <button
                  onClick={() => navigate('/verify-email')}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg text-base font-medium transition-colors"
                >
                  Go to Email Verification
                </button>
                <p className="text-white/60 text-sm mt-4">
                  You will be redirected to the payment page after successful email verification.
                </p>
              </div>
            ) : (
              // Show registration form when not successful
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Google OAuth Button */}
                <GoogleOAuthButton 
                  mode="register"
                />

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-white/60">or continue with email</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-500 text-sm font-medium">{error}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {/* First Name and Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-2">
                        First Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={handleChange}
                          className={inputWithIconClass}
                          placeholder="First name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-2">
                        Last Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={handleChange}
                          className={inputWithIconClass}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        className={inputWithIconClass}
                        placeholder="Choose a username"
                      />
                    </div>
                    <p className="text-white/60 text-xs mt-1">You can login with either username or email</p>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={inputWithIconClass}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {/* Country and Phone - Like in image 3 */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Country & Phone Number *
                    </label>

                    {/* Country Selector Button */}
                    <div className="relative mb-3">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className={`w-full ${inputClass} flex items-center justify-between cursor-pointer`}
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{selectedCountry?.flag}</span>
                          <span className="flex-1 text-left">{selectedCountry?.name}</span>
                          <span className="text-white/60 text-sm ml-2">{selectedCountry?.phoneCode}</span>
                        </div>
                        <ChevronDown className="w-5 h-5 flex-shrink-0" />
                      </button>

                      {showCountryDropdown && (
                        <div className={`absolute top-full left-0 right-0 mt-1 ${theme === 'professional' ? 'bg-gray-800' : 'bg-gray-800'} border ${theme === 'professional' ? 'border-gray-600' : 'border-white/20'} rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto`}>
                          {countries.map(country => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => handleCountrySelect(country.code)}
                              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center text-white border-b border-white/10 last:border-b-0"
                            >
                              <span className="text-xl mr-3">{country.flag}</span>
                              <span className="flex-1">{country.name}</span>
                              <span className="text-green-400 text-sm font-medium">{country.phoneCode}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Phone Number Input */}
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                      <input
                        name="phoneNumber"
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={inputWithIconClass}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className={inputWithIconClass.replace('pr-4', 'pr-12')}
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={inputWithIconClass.replace('pr-4', 'pr-12')}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                {/* Welcome Bonus Box - Green transparent */}
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <div className="text-center">
                    <h4 className="text-green-300 font-medium mb-2">🎉 Welcome Bonus</h4>
                    <p className="text-white/80 text-sm">
                      Deposit {formatDualCurrencySync(activationFeeUSD, selectedCountry?.currency || 'USD')} and get $3.00 instant bonus!
                    </p>
                  </div>
                </div>

                {/* Register & Deposit Button - Deep pink/red */}
                <button
                  type="submit"
                  disabled={loading}
                  onClick={(e) => {
                    console.log('🔴 BUTTON CLICKED! Event:', e.type);
                    console.log('🔴 Button type:', e.currentTarget.type);
                    console.log('🔴 Form element:', e.currentTarget.form);
                    // Don't prevent default here - let the form handle it
                  }}
                  className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white py-4 rounded-lg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin mr-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <span>Creating your account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      <span>Register & Deposit {formatDualCurrencySync(activationFeeUSD, selectedCountry?.currency || 'USD')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
