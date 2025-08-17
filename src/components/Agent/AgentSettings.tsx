import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  Palette, 
  CreditCard, 
  Download, 
  Upload,
  Check,
  X,
  AlertTriangle,
  Save,
  RotateCcw,
  Smartphone,
  Mail,
  Lock,
  Users,
  BarChart3
} from 'lucide-react';

interface AgentSettingsProps {
  className?: string;
}

const AgentSettings: React.FC<AgentSettingsProps> = ({ className }) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('general');
  const [savedChanges, setSavedChanges] = useState(false);
  
  const [settings, setSettings] = useState({
    // General Settings
    displayName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    timezone: 'UTC-5',
    language: 'English',
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    referralNotifications: true,
    earningsAlerts: true,
    weeklyReports: true,
    
    // Privacy Settings
    profileVisibility: 'public',
    showEarnings: false,
    showNetwork: true,
    dataSharing: false,
    
    // Performance Settings
    autoOptimization: true,
    realTimeTracking: true,
    advancedAnalytics: false,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true
  });

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const inputClass = theme === 'professional'
    ? 'bg-gray-700/50 border-gray-600/50 text-white'
    : 'bg-white/10 border-white/20 text-white';

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'security', label: 'Security', icon: Lock }
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    // Here you would save to your backend
    console.log('Saving settings:', settings);
    setSavedChanges(true);
    setTimeout(() => setSavedChanges(false), 3000);
  };

  const resetToDefaults = () => {
    // Reset to default values
    setSettings(prev => ({
      ...prev,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      profileVisibility: 'public',
      autoOptimization: true,
      realTimeTracking: true
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <Settings className="w-8 h-8 mr-3 text-blue-400" />
          Agent Settings
        </h3>
        <div className="flex items-center space-x-3">
          {savedChanges && (
            <div className="flex items-center text-green-300 text-sm">
              <Check className="w-4 h-4 mr-1" />
              Changes saved!
            </div>
          )}
          <button
            onClick={resetToDefaults}
            className={`px-4 py-2 ${theme === 'professional' ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-white/10 hover:bg-white/20'} rounded-lg text-white transition-all duration-200 flex items-center space-x-2`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={saveSettings}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className={`${cardClass} p-6 lg:w-1/4`}>
          <h4 className="text-white font-medium mb-4">Settings Categories</h4>
          <div className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className={`${cardClass} p-6 lg:w-3/4`}>
          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              <h4 className="text-xl font-semibold text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                General Settings
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Display Name</label>
                  <input
                    type="text"
                    value={settings.displayName}
                    onChange={(e) => handleSettingChange('displayName', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} placeholder-white/50`}
                    placeholder="Your display name"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">Email Address</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingChange('email', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} placeholder-white/50`}
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleSettingChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} placeholder-white/50`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                  >
                    <option value="UTC-8">Pacific Time (UTC-8)</option>
                    <option value="UTC-7">Mountain Time (UTC-7)</option>
                    <option value="UTC-6">Central Time (UTC-6)</option>
                    <option value="UTC-5">Eastern Time (UTC-5)</option>
                    <option value="UTC+0">UTC</option>
                    <option value="UTC+1">Central European Time (UTC+1)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <h4 className="text-xl font-semibold text-white flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Preferences
              </h4>
              
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive text message alerts' },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser and mobile push notifications' },
                  { key: 'referralNotifications', label: 'Referral Alerts', desc: 'Notify when someone joins your network' },
                  { key: 'earningsAlerts', label: 'Earnings Alerts', desc: 'Instant alerts for new earnings' },
                  { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly performance summaries' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-white font-medium">{item.label}</div>
                      <div className="text-white/60 text-sm">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => handleSettingChange(item.key, !settings[item.key as keyof typeof settings])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings[item.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Settings */}
          {activeSection === 'performance' && (
            <div className="space-y-6">
              <h4 className="text-xl font-semibold text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance Settings
              </h4>
              
              <div className="space-y-4">
                {[
                  { key: 'autoOptimization', label: 'Auto Optimization', desc: 'Automatically optimize referral targeting' },
                  { key: 'realTimeTracking', label: 'Real-time Tracking', desc: 'Enable live performance monitoring' },
                  { key: 'advancedAnalytics', label: 'Advanced Analytics', desc: 'Detailed conversion and engagement metrics' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-white font-medium">{item.label}</div>
                      <div className="text-white/60 text-sm">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => handleSettingChange(item.key, !settings[item.key as keyof typeof settings])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings[item.key as keyof typeof settings] ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <h4 className="text-xl font-semibold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Privacy & Visibility
              </h4>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Profile Visibility</label>
                  <select
                    value={settings.profileVisibility}
                    onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                  >
                    <option value="public">Public - Visible to everyone</option>
                    <option value="network">Network Only - Visible to your network</option>
                    <option value="private">Private - Hidden from others</option>
                  </select>
                </div>
                
                <div className="space-y-4">
                  {[
                    { key: 'showEarnings', label: 'Show Earnings', desc: 'Display your earnings publicly' },
                    { key: 'showNetwork', label: 'Show Network Size', desc: 'Display your network statistics' },
                    { key: 'dataSharing', label: 'Data Sharing', desc: 'Share anonymous usage data for improvements' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-white font-medium">{item.label}</div>
                        <div className="text-white/60 text-sm">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => handleSettingChange(item.key, !settings[item.key as keyof typeof settings])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings[item.key as keyof typeof settings] ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <h4 className="text-xl font-semibold text-white flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Security Settings
              </h4>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-white font-medium">Two-Factor Authentication</div>
                      <div className="text-white/60 text-sm">Add an extra layer of security to your account</div>
                    </div>
                    <button
                      onClick={() => handleSettingChange('twoFactorAuth', !settings.twoFactorAuth)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.twoFactorAuth ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-white font-medium">Login Alerts</div>
                      <div className="text-white/60 text-sm">Get notified of new login attempts</div>
                    </div>
                    <button
                      onClick={() => handleSettingChange('loginAlerts', !settings.loginAlerts)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.loginAlerts ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">Session Timeout (minutes)</label>
                  <select
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={480}>8 hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentSettings;
