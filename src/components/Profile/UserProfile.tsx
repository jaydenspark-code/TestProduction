import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  User,
  Edit,
  Camera,
  Save,
  X,
  MapPin,
  Globe,
  Phone,
  Mail,
  Calendar,
  Shield,
  CreditCard,
  Settings,
  Bell,
  Eye,
  EyeOff,
  Download,
  Upload,
  Star,
  Award,
  TrendingUp,
  Wallet,
  History,
  Lock,
  Key,
  Smartphone,
  Users
} from 'lucide-react';
import { DualCurrencyDisplay } from '../../utils/currency';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    country: user?.country || '',
    currency: user?.currency || 'USD',
    dateOfBirth: '1990-01-15',
    bio: 'Passionate about earning rewards and building networks.',
    website: '',
    address: '123 Main Street, City, State 12345',
    timezone: 'UTC-5',
    language: 'English'
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    loginAlerts: true,
    withdrawalAlerts: true
  });

  const [accountStats] = useState({
    memberSince: new Date('2024-01-15'),
    totalEarnings: 1247.50,
    totalWithdrawals: 800.00,
    referralCount: 46,
    taskCompleted: 127,
    loginStreak: 15,
    profileCompletion: 85
  });

  const handleSaveProfile = () => {
    // Save profile data
    setIsEditing(false);
  };

  const handleAvatarUpload = () => {
    // Handle avatar upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
  };

  const bgClass = theme === 'professional' 
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const inputClass = theme === 'professional'
    ? 'w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500'
    : 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500';

  const buttonPrimaryClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  const buttonSecondaryClass = theme === 'professional'
    ? 'bg-gray-700/50 hover:bg-gray-600/60 border-gray-600/50'
    : 'bg-white/10 hover:bg-white/20 border-white/20';

  const tabButtonClass = (isActive: boolean) => 
    `px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive 
        ? theme === 'professional'
          ? 'bg-cyan-600 text-white'
          : 'bg-purple-600 text-white'
        : theme === 'professional'
        ? 'bg-gray-700/30 text-white/70 hover:bg-gray-600/40 hover:text-white'
        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
    }`;

  return (
    <div className={`${bgClass} py-8`}>
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <User className="w-8 h-8 mr-3 text-blue-400" />
            Profile & Account Settings
          </h1>
          <p className="text-white/70">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className={`${cardClass} p-6`}>
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3">
                    {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                  <button
                    onClick={handleAvatarUpload}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>
                <h3 className="text-white font-bold">{user?.fullName}</h3>
                <p className="text-white/70 text-sm">{user?.email}</p>
                <div className="mt-2">
                  <span className={`px-3 py-1 ${theme === 'professional' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'} rounded-full text-xs font-medium`}>
                    {user?.isPaidUser ? 'Premium Member' : 'Free Member'}
                  </span>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left ${tabButtonClass(activeTab === 'profile')} flex items-center space-x-2`}
                >
                  <User className="w-4 h-4" />
                  <span>Profile Info</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left ${tabButtonClass(activeTab === 'security')} flex items-center space-x-2`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Security</span>
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full text-left ${tabButtonClass(activeTab === 'preferences')} flex items-center space-x-2`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Preferences</span>
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`w-full text-left ${tabButtonClass(activeTab === 'statistics')} flex items-center space-x-2`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Statistics</span>
                </button>
              </nav>
            </div>

            {/* Quick Stats */}
            <div className={`${cardClass} p-4 mt-6`}>
              <h4 className="text-white font-medium mb-3">Profile Completion</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Progress</span>
                  <span className="text-white">{accountStats.profileCompletion}%</span>
                </div>
                <div className={`w-full ${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/10'} rounded-full h-2`}>
                  <div 
                    className={`${theme === 'professional' ? 'bg-cyan-500' : 'bg-purple-500'} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${accountStats.profileCompletion}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className={`${cardClass} p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Profile Information</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-4 py-2 ${isEditing ? buttonSecondaryClass : buttonPrimaryClass} text-white rounded-lg transition-all duration-200 flex items-center space-x-2 border`}
                  >
                    {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-white p-3 rounded-lg bg-white/5">{profileData.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">Email Address</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        {isEditing ? (
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            className={inputClass}
                          />
                        ) : (
                          <p className="text-white p-3 rounded-lg bg-white/5">{profileData.email}</p>
                        )}
                      </div>
                      {user?.isVerified && (
                        <div className="text-green-400">
                          <Shield className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-white p-3 rounded-lg bg-white/5">{profileData.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">Country</label>
                    {isEditing ? (
                      <select
                        value={profileData.country}
                        onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="">Select Country</option>
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="NG">Nigeria</option>
                        <option value="KE">Kenya</option>
                        <option value="ZA">South Africa</option>
                      </select>
                    ) : (
                      <p className="text-white p-3 rounded-lg bg-white/5">{profileData.country}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">Preferred Currency</label>
                    {isEditing ? (
                      <select
                        value={profileData.currency}
                        onChange={(e) => setProfileData(prev => ({ ...prev, currency: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                        <option value="NGN">NGN - Nigerian Naira</option>
                        <option value="KES">KES - Kenyan Shilling</option>
                        <option value="ZAR">ZAR - South African Rand</option>
                      </select>
                    ) : (
                      <p className="text-white p-3 rounded-lg bg-white/5">{profileData.currency}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-white p-3 rounded-lg bg-white/5">{profileData.dateOfBirth}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-white/70 text-sm mb-2">Bio</label>
                    {isEditing ? (
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        className={`${inputClass} resize-none`}
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-white p-3 rounded-lg bg-white/5">{profileData.bio}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">Website</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                        className={inputClass}
                        placeholder="https://yourwebsite.com"
                      />
                    ) : (
                      <p className="text-white p-3 rounded-lg bg-white/5">{profileData.website || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">Timezone</label>
                    {isEditing ? (
                      <select
                        value={profileData.timezone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="UTC-12">UTC-12</option>
                        <option value="UTC-8">UTC-8 (PST)</option>
                        <option value="UTC-5">UTC-5 (EST)</option>
                        <option value="UTC+0">UTC+0 (GMT)</option>
                        <option value="UTC+1">UTC+1 (CET)</option>
                        <option value="UTC+8">UTC+8 (CST)</option>
                      </select>
                    ) : (
                      <p className="text-white p-3 rounded-lg bg-white/5">{profileData.timezone}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={handleSaveProfile}
                      className={`${buttonPrimaryClass} text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2`}
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className={`${buttonSecondaryClass} text-white px-6 py-3 rounded-lg transition-all duration-200 border`}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className={`${cardClass} p-6`}>
                  <h3 className="text-xl font-bold text-white mb-6">Security Settings</h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                        <p className="text-white/70 text-sm">Add an extra layer of security to your account</p>
                      </div>
                      <button
                        onClick={() => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          securitySettings.twoFactorEnabled 
                            ? theme === 'professional' ? 'bg-cyan-600' : 'bg-purple-600'
                            : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Login Alerts</h4>
                        <p className="text-white/70 text-sm">Get notified of login attempts</p>
                      </div>
                      <button
                        onClick={() => setSecuritySettings(prev => ({ ...prev, loginAlerts: !prev.loginAlerts }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          securitySettings.loginAlerts 
                            ? theme === 'professional' ? 'bg-cyan-600' : 'bg-purple-600'
                            : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Change Password</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/70 text-sm mb-2">Current Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className={inputClass}
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-white/70 text-sm mb-2">New Password</label>
                          <input
                            type="password"
                            className={inputClass}
                            placeholder="Enter new password"
                          />
                        </div>
                      </div>
                      <button className={`${buttonPrimaryClass} text-white px-4 py-2 rounded-lg transition-all duration-200`}>
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`${cardClass} p-6`}>
                  <h3 className="text-xl font-bold text-white mb-6">Active Sessions</h3>
                  <div className="space-y-4">
                    {[
                      { device: 'Current Session', location: 'New York, US', time: 'Now', current: true },
                      { device: 'iPhone 13', location: 'New York, US', time: '2 hours ago', current: false },
                      { device: 'Chrome Browser', location: 'London, UK', time: '1 day ago', current: false }
                    ].map((session, index) => (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'}`}>
                        <div className="flex items-center space-x-3">
                          <Smartphone className="w-5 h-5 text-white/70" />
                          <div>
                            <p className="text-white font-medium">{session.device}</p>
                            <p className="text-white/70 text-sm">{session.location} • {session.time}</p>
                          </div>
                        </div>
                        {session.current ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Current</span>
                        ) : (
                          <button className={`px-3 py-1 ${buttonSecondaryClass} text-white text-xs rounded border`}>
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Email Notifications</h4>
                      <p className="text-white/70 text-sm">Receive updates via email</p>
                    </div>
                    <button
                      onClick={() => setSecuritySettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        securitySettings.emailNotifications 
                          ? theme === 'professional' ? 'bg-cyan-600' : 'bg-purple-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">SMS Notifications</h4>
                      <p className="text-white/70 text-sm">Receive updates via text message</p>
                    </div>
                    <button
                      onClick={() => setSecuritySettings(prev => ({ ...prev, smsNotifications: !prev.smsNotifications }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        securitySettings.smsNotifications 
                          ? theme === 'professional' ? 'bg-cyan-600' : 'bg-purple-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Withdrawal Alerts</h4>
                      <p className="text-white/70 text-sm">Get notified of withdrawal activities</p>
                    </div>
                    <button
                      onClick={() => setSecuritySettings(prev => ({ ...prev, withdrawalAlerts: !prev.withdrawalAlerts }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        securitySettings.withdrawalAlerts 
                          ? theme === 'professional' ? 'bg-cyan-600' : 'bg-purple-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.withdrawalAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-white font-medium mb-4">Data & Privacy</h4>
                  <div className="space-y-3">
                    <button className={`w-full ${buttonSecondaryClass} text-white p-3 rounded-lg transition-all duration-200 border flex items-center justify-between`}>
                      <span>Download My Data</span>
                      <Download className="w-4 h-4" />
                    </button>
                    <button className={`w-full ${buttonSecondaryClass} text-white p-3 rounded-lg transition-all duration-200 border flex items-center justify-between`}>
                      <span>Delete Account</span>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <div className="space-y-6">
                <div className={`${cardClass} p-6`}>
                  <h3 className="text-xl font-bold text-white mb-6">Account Statistics</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className={`p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <Calendar className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`} />
                        <h4 className="text-white font-medium">Member Since</h4>
                      </div>
                      <p className="text-white text-lg font-bold">
                        {accountStats.memberSince.toLocaleDateString()}
                      </p>
                      <p className="text-white/70 text-sm">
                        {Math.floor((Date.now() - accountStats.memberSince.getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <Wallet className="w-6 h-6 text-green-300" />
                        <h4 className="text-white font-medium">Total Earnings</h4>
                      </div>
                      <DualCurrencyDisplay 
                        usdAmount={accountStats.totalEarnings} 
                        userCurrency={user?.currency || 'USD'} 
                        className="text-white text-lg font-bold"
                      />
                      <p className="text-green-300 text-sm">+12.5% this month</p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <CreditCard className="w-6 h-6 text-blue-300" />
                        <h4 className="text-white font-medium">Total Withdrawals</h4>
                      </div>
                      <DualCurrencyDisplay 
                        usdAmount={accountStats.totalWithdrawals} 
                        userCurrency={user?.currency || 'USD'} 
                        className="text-white text-lg font-bold"
                      />
                      <p className="text-white/70 text-sm">Last: 7 days ago</p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <User className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`} />
                        <h4 className="text-white font-medium">Referrals</h4>
                      </div>
                      <p className="text-white text-lg font-bold">{accountStats.referralCount}</p>
                      <p className="text-white/70 text-sm">Active referrals</p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <Award className="w-6 h-6 text-yellow-300" />
                        <h4 className="text-white font-medium">Tasks Completed</h4>
                      </div>
                      <p className="text-white text-lg font-bold">{accountStats.taskCompleted}</p>
                      <p className="text-white/70 text-sm">All time</p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <Star className="w-6 h-6 text-orange-300" />
                        <h4 className="text-white font-medium">Login Streak</h4>
                      </div>
                      <p className="text-white text-lg font-bold">{accountStats.loginStreak} days</p>
                      <p className="text-white/70 text-sm">Keep it up!</p>
                    </div>
                  </div>
                </div>

                <div className={`${cardClass} p-6`}>
                  <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    {[
                      { action: 'Profile updated', time: '2 hours ago', icon: User },
                      { action: 'Password changed', time: '1 day ago', icon: Lock },
                      { action: 'Withdrawal completed', time: '3 days ago', icon: CreditCard },
                      { action: 'New referral joined', time: '5 days ago', icon: User },
                      { action: 'Task completed', time: '1 week ago', icon: Award }
                    ].map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div key={index} className={`flex items-center space-x-4 p-3 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'}`}>
                          <Icon className={`w-5 h-5 ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`} />
                          <div className="flex-1">
                            <p className="text-white font-medium">{activity.action}</p>
                            <p className="text-white/70 text-sm">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;