import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Target, 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Settings,
  Globe,
  UserCheck,
  Eye,
  MousePointer,
  Heart,
  Briefcase,
  Smartphone,
  Monitor,
  Tablet,
  Plus,
  Minus,
  Save
} from 'lucide-react';

const AudienceTargeting: React.FC = () => {
  const { theme } = useTheme();
  
  const [targetingSettings, setTargetingSettings] = useState({
    demographics: {
      ageRange: { min: 18, max: 65 },
      gender: ['all'], // 'male', 'female', 'all'
      languages: ['english', 'french']
    },
    geographic: {
      countries: ['GH', 'NG', 'KE', 'ZA'],
      regions: [],
      cities: [],
      radius: 50,
      selectedRegion: 'all' // Filter by region
    },
    interests: {
      categories: ['technology', 'finance', 'education', 'health'],
      keywords: ['crypto', 'investment', 'online earning', 'digital marketing']
    },
    behavior: {
      deviceTypes: ['mobile', 'desktop'],
      platforms: ['android', 'ios', 'web'],
      activityLevel: 'active', // 'all', 'active', 'highly_active'
      spendingHabits: 'all' // 'all', 'low', 'medium', 'high'
    },
    advanced: {
      lookalikes: false,
      exclusions: [],
      customAudiences: false,
      retargeting: false
    }
  });

  const cardClass = theme === 'professional' 
    ? 'bg-gray-800/50 backdrop-blur-lg border border-gray-700/50' 
    : 'bg-white/10 backdrop-blur-lg border border-white/20';

  const handleSettingChange = (section: string, key: string, value: any) => {
    setTargetingSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleArrayToggle = (section: string, key: string, item: string) => {
    setTargetingSettings(prev => {
      const currentArray = prev[section][key];
      const newArray = currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item];
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: newArray
        }
      };
    });
  };

  const countries = [
    // Africa
    { code: 'GH', name: 'Ghana', users: '2.1M', region: 'Africa' },
    { code: 'NG', name: 'Nigeria', users: '4.5M', region: 'Africa' },
    { code: 'KE', name: 'Kenya', users: '1.8M', region: 'Africa' },
    { code: 'ZA', name: 'South Africa', users: '1.2M', region: 'Africa' },
    { code: 'EG', name: 'Egypt', users: '980K', region: 'Africa' },
    { code: 'MA', name: 'Morocco', users: '650K', region: 'Africa' },
    { code: 'TN', name: 'Tunisia', users: '420K', region: 'Africa' },
    { code: 'UG', name: 'Uganda', users: '380K', region: 'Africa' },
    
    // North America
    { code: 'US', name: 'United States', users: '8.9M', region: 'North America' },
    { code: 'CA', name: 'Canada', users: '2.3M', region: 'North America' },
    { code: 'MX', name: 'Mexico', users: '3.1M', region: 'North America' },
    
    // Europe
    { code: 'GB', name: 'United Kingdom', users: '3.8M', region: 'Europe' },
    { code: 'DE', name: 'Germany', users: '4.2M', region: 'Europe' },
    { code: 'FR', name: 'France', users: '3.5M', region: 'Europe' },
    { code: 'IT', name: 'Italy', users: '2.8M', region: 'Europe' },
    { code: 'ES', name: 'Spain', users: '2.4M', region: 'Europe' },
    { code: 'NL', name: 'Netherlands', users: '1.9M', region: 'Europe' },
    { code: 'PL', name: 'Poland', users: '2.1M', region: 'Europe' },
    { code: 'SE', name: 'Sweden', users: '1.2M', region: 'Europe' },
    
    // Asia
    { code: 'IN', name: 'India', users: '12.5M', region: 'Asia' },
    { code: 'CN', name: 'China', users: '9.8M', region: 'Asia' },
    { code: 'JP', name: 'Japan', users: '4.1M', region: 'Asia' },
    { code: 'KR', name: 'South Korea', users: '2.9M', region: 'Asia' },
    { code: 'SG', name: 'Singapore', users: '890K', region: 'Asia' },
    { code: 'MY', name: 'Malaysia', users: '1.4M', region: 'Asia' },
    { code: 'TH', name: 'Thailand', users: '1.8M', region: 'Asia' },
    { code: 'VN', name: 'Vietnam', users: '2.2M', region: 'Asia' },
    { code: 'PH', name: 'Philippines', users: '2.7M', region: 'Asia' },
    { code: 'ID', name: 'Indonesia', users: '3.9M', region: 'Asia' },
    
    // South America
    { code: 'BR', name: 'Brazil', users: '6.1M', region: 'South America' },
    { code: 'AR', name: 'Argentina', users: '2.3M', region: 'South America' },
    { code: 'CO', name: 'Colombia', users: '1.8M', region: 'South America' },
    { code: 'CL', name: 'Chile', users: '1.1M', region: 'South America' },
    { code: 'PE', name: 'Peru', users: '1.4M', region: 'South America' },
    
    // Oceania
    { code: 'AU', name: 'Australia', users: '2.8M', region: 'Oceania' },
    { code: 'NZ', name: 'New Zealand', users: '650K', region: 'Oceania' },
    
    // Middle East
    { code: 'AE', name: 'UAE', users: '1.2M', region: 'Middle East' },
    { code: 'SA', name: 'Saudi Arabia', users: '1.8M', region: 'Middle East' },
    { code: 'IL', name: 'Israel', users: '780K', region: 'Middle East' },
    { code: 'TR', name: 'Turkey', users: '2.9M', region: 'Middle East' }
  ];

  const interestCategories = [
    { id: 'technology', name: 'Technology', icon: Smartphone, users: '3.2M' },
    { id: 'finance', name: 'Finance & Investment', icon: DollarSign, users: '2.8M' },
    { id: 'education', name: 'Education', icon: Briefcase, users: '2.1M' },
    { id: 'health', name: 'Health & Wellness', icon: Heart, users: '1.9M' },
    { id: 'business', name: 'Business', icon: TrendingUp, users: '1.7M' },
    { id: 'entertainment', name: 'Entertainment', icon: Eye, users: '4.1M' }
  ];

  const saveTargeting = () => {
    console.log('Saving targeting settings:', targetingSettings);
    alert('Targeting settings saved successfully!');
  };

  const estimatedReach = () => {
    // Simple calculation based on selected criteria
    let baseReach = 5000000; // 5M total users
    
    // Adjust based on geographic selection
    if (targetingSettings.geographic.countries.length > 0) {
      baseReach = targetingSettings.geographic.countries.length * 1200000;
    }
    
    // Adjust based on age range
    const ageRangeSize = targetingSettings.demographics.ageRange.max - targetingSettings.demographics.ageRange.min;
    baseReach = Math.floor(baseReach * (ageRangeSize / 50));
    
    // Adjust based on interests
    baseReach = Math.floor(baseReach * (targetingSettings.interests.categories.length * 0.3));
    
    return Math.max(10000, Math.min(baseReach, 5000000));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Target className="w-8 h-8 text-purple-400" />
          <h2 className="text-3xl font-bold text-white">Audience Targeting</h2>
        </div>
        <button
          onClick={saveTargeting}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-all duration-200"
        >
          <Save className="w-5 h-5" />
          <span>Save Targeting</span>
        </button>
      </div>

      {/* Estimated Reach */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Users className="w-6 h-6 text-green-400 mr-2" />
            Estimated Reach
          </h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">
              {estimatedReach().toLocaleString()}
            </div>
            <div className="text-sm text-gray-300 font-medium">potential users</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-4 bg-gradient-to-br from-blue-600/40 to-blue-700/40 border border-blue-500/30 rounded-xl">
            <div className="text-blue-300 font-bold text-lg">~15%</div>
            <div className="text-gray-300 font-medium">Expected CTR</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-600/40 to-purple-700/40 border border-purple-500/30 rounded-xl">
            <div className="text-purple-300 font-bold text-lg">~8%</div>
            <div className="text-gray-300 font-medium">Conversion Rate</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-600/40 to-green-700/40 border border-green-500/30 rounded-xl">
            <div className="text-green-300 font-bold text-lg">$0.25</div>
            <div className="text-gray-300 font-medium">Avg. Cost per Click</div>
          </div>
        </div>
      </div>

      {/* Demographics Targeting */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Users className="w-6 h-6 text-blue-400 mr-2" />
          Demographics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/70 mb-3">Age Range</label>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="13"
                  max="80"
                  value={targetingSettings.demographics.ageRange.min}
                  onChange={(e) => handleSettingChange('demographics', 'ageRange', {
                    ...targetingSettings.demographics.ageRange,
                    min: parseInt(e.target.value)
                  })}
                  className="flex-1"
                />
                <span className="text-white min-w-[60px]">
                  {targetingSettings.demographics.ageRange.min} - {targetingSettings.demographics.ageRange.max}
                </span>
                <input
                  type="range"
                  min="13"
                  max="80"
                  value={targetingSettings.demographics.ageRange.max}
                  onChange={(e) => handleSettingChange('demographics', 'ageRange', {
                    ...targetingSettings.demographics.ageRange,
                    max: parseInt(e.target.value)
                  })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-white/70 mb-3">Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {['all', 'male', 'female'].map((gender) => (
                <button
                  key={gender}
                  onClick={() => handleSettingChange('demographics', 'gender', [gender])}
                  className={`p-3 rounded-lg text-center capitalize transition-all duration-200 ${
                    targetingSettings.demographics.gender.includes(gender)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Geographic Targeting */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <MapPin className="w-6 h-6 text-green-400 mr-2" />
          Geographic Targeting
        </h3>
        
        {/* Region Filter */}
        <div className="mb-6">
          <label className="block text-white/70 mb-3">Filter by Region</label>
          <div className="flex flex-wrap gap-2">
            {['all', 'Africa', 'North America', 'Europe', 'Asia', 'South America', 'Oceania', 'Middle East'].map((region) => (
              <button
                key={region}
                onClick={() => handleSettingChange('geographic', 'selectedRegion', region)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  targetingSettings.geographic.selectedRegion === region
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
        
        {/* Countries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {countries
            .filter(country => 
              targetingSettings.geographic.selectedRegion === 'all' || 
              country.region === targetingSettings.geographic.selectedRegion
            )
            .map((country) => (
            <div
              key={country.code}
              onClick={() => handleArrayToggle('geographic', 'countries', country.code)}
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                targetingSettings.geographic.countries.includes(country.code)
                  ? 'bg-gradient-to-br from-green-600/30 to-emerald-600/30 border-green-500 shadow-lg shadow-green-500/20 transform scale-105'
                  : 'bg-gray-700/30 border-gray-600/50 hover:border-green-400/50 hover:bg-gray-600/40 hover:scale-102'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{country.name}</span>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-xs text-gray-400">{country.region}</span>
                </div>
              </div>
              <div className="text-sm text-gray-300 font-medium">{country.users} users</div>
              {targetingSettings.geographic.countries.includes(country.code) && (
                <div className="mt-2 flex items-center text-green-400 text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Quick Select Options */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              const allCountries = countries.map(c => c.code);
              handleSettingChange('geographic', 'countries', allCountries);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
          >
            Select All
          </button>
          <button
            onClick={() => handleSettingChange('geographic', 'countries', [])}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm hover:from-red-700 hover:to-red-800 transition-all duration-200"
          >
            Clear All
          </button>
          <button
            onClick={() => {
              const topCountries = ['US', 'IN', 'CN', 'NG', 'BR', 'GB', 'DE', 'FR'];
              handleSettingChange('geographic', 'countries', topCountries);
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
          >
            Select Top Markets
          </button>
        </div>
      </div>

      {/* Interest Targeting */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Heart className="w-6 h-6 text-pink-400 mr-2" />
          Interest Categories
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interestCategories.map((category) => {
            const Icon = category.icon;
            const isSelected = targetingSettings.interests.categories.includes(category.id);
            return (
              <div
                key={category.id}
                onClick={() => handleArrayToggle('interests', 'categories', category.id)}
                className={`p-5 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                  isSelected
                    ? 'bg-gradient-to-br from-pink-600/30 to-purple-600/30 border-pink-500 shadow-lg shadow-pink-500/20 transform scale-105'
                    : 'bg-gray-700/30 border-gray-600/50 hover:border-pink-400/50 hover:bg-gray-600/40 hover:scale-102'
                }`}
              >
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg mr-3 ${
                    isSelected 
                      ? 'bg-pink-500/20 text-pink-300' 
                      : 'bg-gray-600/50 text-gray-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-white">{category.name}</span>
                </div>
                <div className="text-sm text-gray-300 font-medium">{category.users} interested users</div>
                {isSelected && (
                  <div className="mt-3 flex items-center text-pink-400 text-xs">
                    <div className="w-2 h-2 bg-pink-400 rounded-full mr-1 animate-pulse"></div>
                    Active Targeting
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Quick Select for Interests */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              const allInterests = interestCategories.map(c => c.id);
              handleSettingChange('interests', 'categories', allInterests);
            }}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg text-sm hover:from-pink-700 hover:to-purple-700 transition-all duration-200"
          >
            Select All Interests
          </button>
          <button
            onClick={() => handleSettingChange('interests', 'categories', [])}
            className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg text-sm hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
          >
            Clear Interests
          </button>
        </div>
      </div>

      {/* Device & Platform Targeting */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Smartphone className="w-6 h-6 text-cyan-400 mr-2" />
          Device & Platform
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/70 mb-3 font-semibold">Device Types</label>
            <div className="space-y-3">
              {[
                { id: 'mobile', name: 'Mobile', icon: Smartphone, usage: '78% of users' },
                { id: 'desktop', name: 'Desktop', icon: Monitor, usage: '45% of users' },
                { id: 'tablet', name: 'Tablet', icon: Tablet, usage: '23% of users' }
              ].map((device) => {
                const Icon = device.icon;
                const isSelected = targetingSettings.behavior.deviceTypes.includes(device.id);
                return (
                  <div
                    key={device.id}
                    onClick={() => handleArrayToggle('behavior', 'deviceTypes', device.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border-cyan-500 shadow-lg shadow-cyan-500/20 transform scale-105'
                        : 'bg-gray-700/30 border-gray-600/50 hover:border-cyan-400/50 hover:bg-gray-600/40 hover:scale-102'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          isSelected 
                            ? 'bg-cyan-500/20 text-cyan-300' 
                            : 'bg-gray-600/50 text-gray-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-white font-semibold block">{device.name}</span>
                          <span className="text-gray-300 text-sm">{device.usage}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center text-cyan-400 text-xs">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-1 animate-pulse"></div>
                          Active
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="block text-white/70 mb-3 font-semibold">Activity Level</label>
            <div className="space-y-3">
              {[
                { id: 'all', name: 'All Users', desc: 'Include all registered users', reach: '2.5M users' },
                { id: 'active', name: 'Active Users', desc: 'Users active in last 30 days', reach: '1.8M users' },
                { id: 'highly_active', name: 'Highly Active', desc: 'Daily active users', reach: '650K users' }
              ].map((level) => {
                const isSelected = targetingSettings.behavior.activityLevel === level.id;
                return (
                  <div
                    key={level.id}
                    onClick={() => handleSettingChange('behavior', 'activityLevel', level.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                      isSelected
                        ? 'bg-gradient-to-br from-yellow-600/30 to-orange-600/30 border-yellow-500 shadow-lg shadow-yellow-500/20 transform scale-105'
                        : 'bg-gray-700/30 border-gray-600/50 hover:border-yellow-400/50 hover:bg-gray-600/40 hover:scale-102'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{level.name}</span>
                      {isSelected && (
                        <div className="flex items-center text-yellow-400 text-xs">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1 animate-pulse"></div>
                          Selected
                        </div>
                      )}
                    </div>
                    <div className="text-gray-300 text-sm mb-1">{level.desc}</div>
                    <div className="text-yellow-400 text-xs font-medium">{level.reach}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Quick Device Selection */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleSettingChange('behavior', 'deviceTypes', ['mobile', 'desktop', 'tablet'])}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-sm hover:from-cyan-700 hover:to-blue-700 transition-all duration-200"
          >
            All Devices
          </button>
          <button
            onClick={() => handleSettingChange('behavior', 'deviceTypes', ['mobile'])}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
          >
            Mobile Only
          </button>
          <button
            onClick={() => handleSettingChange('behavior', 'deviceTypes', [])}
            className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg text-sm hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Advanced Targeting */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Settings className="w-6 h-6 text-orange-400 mr-2" />
          Advanced Options
        </h3>
        
        <div className="space-y-4">
          {[
            { 
              key: 'lookalikes', 
              name: 'Lookalike Audiences', 
              desc: 'Find users similar to your best customers' 
            },
            { 
              key: 'customAudiences', 
              name: 'Custom Audiences', 
              desc: 'Target specific user lists you upload' 
            },
            { 
              key: 'retargeting', 
              name: 'Retargeting', 
              desc: 'Re-engage users who visited your campaigns' 
            }
          ].map((option) => (
            <div key={option.key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div>
                <div className="text-white font-medium">{option.name}</div>
                <div className="text-sm text-gray-400">{option.desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetingSettings.advanced[option.key]}
                  onChange={(e) => handleSettingChange('advanced', option.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Targeting Summary */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <h3 className="text-xl font-bold text-white mb-6">Targeting Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-5 bg-gradient-to-br from-blue-600/40 to-blue-700/40 border border-blue-500/30 rounded-xl">
            <div className="text-blue-300 font-bold text-2xl mb-1">
              {targetingSettings.geographic.countries.length}
            </div>
            <div className="text-gray-300 font-medium">Countries Selected</div>
          </div>
          
          <div className="p-5 bg-gradient-to-br from-green-600/40 to-green-700/40 border border-green-500/30 rounded-xl">
            <div className="text-green-300 font-bold text-2xl mb-1">
              {targetingSettings.demographics.ageRange.max - targetingSettings.demographics.ageRange.min}
            </div>
            <div className="text-gray-300 font-medium">Age Range Span</div>
          </div>
          
          <div className="p-5 bg-gradient-to-br from-pink-600/40 to-pink-700/40 border border-pink-500/30 rounded-xl">
            <div className="text-pink-300 font-bold text-2xl mb-1">
              {targetingSettings.interests.categories.length}
            </div>
            <div className="text-gray-300 font-medium">Interest Categories</div>
          </div>
          
          <div className="p-5 bg-gradient-to-br from-cyan-600/40 to-cyan-700/40 border border-cyan-500/30 rounded-xl">
            <div className="text-cyan-300 font-bold text-2xl mb-1">
              {targetingSettings.behavior.deviceTypes.length}
            </div>
            <div className="text-gray-300 font-medium">Device Types</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudienceTargeting;
