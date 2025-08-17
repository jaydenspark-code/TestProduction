import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Settings, 
  Building, 
  Bell, 
  Shield, 
  CreditCard, 
  Users, 
  Globe, 
  Zap,
  Mail,
  Phone,
  MapPin,
  Target,
  DollarSign,
  Eye,
  Save
} from 'lucide-react';

const AdvertiserSettings: React.FC = () => {
  const { theme } = useTheme();
  
  const [settings, setSettings] = useState({
    company: {
      name: 'EarnPro Marketing Co.',
      email: 'marketing@earnpro.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business Ave, Digital City, DC 12345',
      website: 'https://earnpro.com',
      industry: 'Digital Marketing'
    },
    preferences: {
      notifications: {
        campaignUpdates: true,
        budgetAlerts: true,
        performanceReports: true,
        newFeatures: false,
        weeklyDigest: true
      },
      targeting: {
        autoOptimization: true,
        demographicSuggestions: true,
        behaviorTracking: true,
        geographicExpansion: false
      },
      billing: {
        autoRecharge: false,
        lowBalanceAlert: true,
        monthlyReports: true,
        spendingLimits: true
      }
    },
    security: {
      twoFactorAuth: false,
      loginNotifications: true,
      apiAccess: false,
      dataEncryption: true
    }
  });

  const cardClass = theme === 'professional' 
    ? 'bg-gray-800/50 backdrop-blur-lg border border-gray-700/50' 
    : 'bg-white/10 backdrop-blur-lg border border-white/20';

  const handleSettingChange = (section: keyof typeof settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value
      }
    }));
  };

  const handleNestedSettingChange = (section: keyof typeof settings, subsection: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [subsection]: {
          ...((prev[section] as any)[subsection] as any),
          [key]: value
        }
      }
    }));
  };

  const saveSettings = () => {
    // Here you would typically save to backend
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">Advertiser Settings</h2>
        </div>
        <button
          onClick={saveSettings}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-all duration-200"
        >
          <Save className="w-5 h-5" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Company Information */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <Building className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Company Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/70 mb-2">Company Name</label>
            <input
              type="text"
              value={settings.company.name}
              onChange={(e) => handleSettingChange('company', 'name', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-white/70 mb-2">Industry</label>
            <select
              value={settings.company.industry}
              onChange={(e) => handleSettingChange('company', 'industry', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Technology">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-white/70 mb-2">Contact Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={settings.company.email}
                onChange={(e) => handleSettingChange('company', 'email', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-white/70 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={settings.company.phone}
                onChange={(e) => handleSettingChange('company', 'phone', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-white/70 mb-2">Business Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={settings.company.address}
                onChange={(e) => handleSettingChange('company', 'address', e.target.value)}
                rows={2}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-white/70 mb-2">Website URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={settings.company.website}
                onChange={(e) => handleSettingChange('company', 'website', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">Notification Preferences</h3>
        </div>
        
        <div className="space-y-4">
          {Object.entries(settings.preferences.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {key === 'campaignUpdates' && <Target className="w-5 h-5 text-blue-400 mr-2" />}
                  {key === 'budgetAlerts' && <DollarSign className="w-5 h-5 text-red-400 mr-2" />}
                  {key === 'performanceReports' && <Eye className="w-5 h-5 text-purple-400 mr-2" />}
                  {key === 'newFeatures' && <Zap className="w-5 h-5 text-yellow-400 mr-2" />}
                  {key === 'weeklyDigest' && <Mail className="w-5 h-5 text-green-400 mr-2" />}
                  <span className="text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNestedSettingChange('preferences', 'notifications', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign & Targeting Preferences */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Campaign & Targeting</h3>
        </div>
        
        <div className="space-y-4">
          {Object.entries(settings.preferences.targeting).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <span className="text-gray-400 text-sm">
                  {key === 'autoOptimization' && 'Automatically optimize campaigns for better performance'}
                  {key === 'demographicSuggestions' && 'Get AI-powered demographic targeting suggestions'}
                  {key === 'behaviorTracking' && 'Track user behavior for better targeting'}
                  {key === 'geographicExpansion' && 'Suggest new geographic markets automatically'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNestedSettingChange('preferences', 'targeting', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-white">Security & Privacy</h3>
        </div>
        
        <div className="space-y-4">
          {Object.entries(settings.security).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <span className="text-gray-400 text-sm">
                  {key === 'twoFactorAuth' && 'Add an extra layer of security to your account'}
                  {key === 'loginNotifications' && 'Get notified of login attempts'}
                  {key === 'apiAccess' && 'Enable API access for third-party integrations'}
                  {key === 'dataEncryption' && 'Encrypt sensitive campaign data'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleSettingChange('security', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Preferences */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <CreditCard className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">Billing & Payment</h3>
        </div>
        
        <div className="space-y-4">
          {Object.entries(settings.preferences.billing).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <span className="text-gray-400 text-sm">
                  {key === 'autoRecharge' && 'Automatically add funds when balance is low'}
                  {key === 'lowBalanceAlert' && 'Get alerts when account balance is running low'}
                  {key === 'monthlyReports' && 'Receive detailed monthly spending reports'}
                  {key === 'spendingLimits' && 'Set and enforce daily/monthly spending limits'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNestedSettingChange('preferences', 'billing', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <h3 className="text-xl font-bold text-white mb-6">Account Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all duration-200">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <div className="text-sm font-medium">Manage Team</div>
            <div className="text-xs text-gray-400">Add team members</div>
          </button>
          
          <button className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-all duration-200">
            <Zap className="w-8 h-8 mx-auto mb-2" />
            <div className="text-sm font-medium">API Keys</div>
            <div className="text-xs text-gray-400">Manage integrations</div>
          </button>
          
          <button className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-all duration-200">
            <Shield className="w-8 h-8 mx-auto mb-2" />
            <div className="text-sm font-medium">Export Data</div>
            <div className="text-xs text-gray-400">Download your data</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvertiserSettings;
