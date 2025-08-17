import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle, 
  ExternalLink,
  Copy,
  Zap,
  Youtube,
  MessageCircle,
  Instagram,
  Twitter,
  Camera,
  Globe,
  BarChart3
} from 'lucide-react';

interface SocialMediaAPIConfigProps {
  onApiKeysUpdate?: (keys: Record<string, string>) => void;
}

const SocialMediaAPIConfig: React.FC<SocialMediaAPIConfigProps> = ({ onApiKeysUpdate }) => {
  const { theme } = useTheme();
  const [showKeys, setShowKeys] = useState(false);
  const [copied, setCopied] = useState('');
  
  const [apiKeys, setApiKeys] = useState({
    rapidapi: '',
    telegram: '',
    google: '',
    socialblade: ''
  });

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-xl border border-white/20';

  const inputClass = theme === 'professional'
    ? 'bg-gray-700/50 border-gray-600/50 text-white'
    : 'bg-white/10 border-white/20 text-white';

  const handleKeyChange = (platform: string, value: string) => {
    const updated = { ...apiKeys, [platform]: value };
    setApiKeys(updated);
    onApiKeysUpdate?.(updated);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const testAPI = async (platform: string) => {
    // Here you would test the API key
    console.log(`Testing ${platform} API...`);
  };

  const platforms = [
    {
      id: 'telegram',
      name: 'Telegram Bot API',
      icon: MessageCircle,
      color: 'text-blue-400',
      cost: 'FREE',
      setup: '2 minutes',
      description: 'Get real member counts for Telegram channels',
      placeholder: '123456789:ABCdef1234567890abcdef...',
      steps: [
        'Open Telegram and message @BotFather',
        'Type /newbot and follow prompts',
        'Copy the bot token provided',
        'Paste token here'
      ],
      priority: 'HIGH'
    },
    {
      id: 'rapidapi',
      name: 'RapidAPI',
      icon: Zap,
      color: 'text-purple-400',
      cost: '$0-20/month',
      setup: '5 minutes',
      description: 'Access YouTube, Instagram, TikTok, Twitter APIs',
      placeholder: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...',
      steps: [
        'Sign up at rapidapi.com',
        'Go to your dashboard',
        'Copy your API key',
        'Subscribe to social media APIs'
      ],
      priority: 'MEDIUM'
    },
    {
      id: 'google',
      name: 'Google YouTube API',
      icon: Youtube,
      color: 'text-red-400',
      cost: '100 req/day free',
      setup: '10 minutes',
      description: 'Official YouTube subscriber counts',
      placeholder: 'AIzaSyC1234567890abcdef...',
      steps: [
        'Go to Google Cloud Console',
        'Create new project or select existing',
        'Enable YouTube Data API v3',
        'Create API key and copy'
      ],
      priority: 'MEDIUM'
    },
    {
      id: 'socialblade',
      name: 'SocialBlade API',
      icon: BarChart3,
      color: 'text-green-400',
      cost: 'Optional',
      setup: '5 minutes',
      description: 'Enhanced analytics and historical data',
      placeholder: 'sb_1234567890abcdef...',
      steps: [
        'Sign up at socialblade.com',
        'Go to API section',
        'Generate API key',
        'Copy key here (optional)'
      ],
      priority: 'LOW'
    }
  ];

  const currentStatus = {
    telegram: apiKeys.telegram ? 'CONFIGURED' : 'NEEDED',
    rapidapi: apiKeys.rapidapi ? 'CONFIGURED' : 'NEEDED',
    google: apiKeys.google ? 'CONFIGURED' : 'OPTIONAL',
    socialblade: apiKeys.socialblade ? 'CONFIGURED' : 'OPTIONAL'
  };

  const overallStatus = currentStatus.telegram === 'CONFIGURED' || currentStatus.rapidapi === 'CONFIGURED' ? 'READY' : 'SETUP_NEEDED';

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Key className="w-6 h-6 mr-3 text-blue-400" />
            Social Media API Configuration
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            overallStatus === 'READY' 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-yellow-500/20 text-yellow-300'
          }`}>
            {overallStatus === 'READY' ? '✅ Ready for Real-time Data' : '⚠️ Setup Required'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <div key={platform.id} className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <platform.icon className={`w-5 h-5 ${platform.color}`} />
                <span className={`text-xs px-2 py-1 rounded ${
                  currentStatus[platform.id as keyof typeof currentStatus] === 'CONFIGURED'
                    ? 'bg-green-500/20 text-green-300'
                    : platform.priority === 'HIGH'
                    ? 'bg-red-500/20 text-red-300'
                    : platform.priority === 'MEDIUM'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-gray-500/20 text-gray-300'
                }`}>
                  {currentStatus[platform.id as keyof typeof currentStatus]}
                </span>
              </div>
              <h4 className="text-white font-medium text-sm">{platform.name}</h4>
              <p className="text-white/60 text-xs mt-1">{platform.cost}</p>
            </div>
          ))}
        </div>
      </div>

      {/* API Configuration Forms */}
      <div className="space-y-6">
        {platforms.map((platform) => (
          <div key={platform.id} className={`${cardClass} p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  platform.priority === 'HIGH' 
                    ? 'bg-red-500/20' 
                    : platform.priority === 'MEDIUM'
                    ? 'bg-yellow-500/20'
                    : 'bg-gray-500/20'
                }`}>
                  <platform.icon className={`w-5 h-5 ${platform.color}`} />
                </div>
                <div>
                  <h4 className="text-white font-semibold">{platform.name}</h4>
                  <p className="text-white/60 text-sm">{platform.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/60 text-xs">Setup time: {platform.setup}</div>
                <div className="text-white/60 text-xs">Cost: {platform.cost}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* API Key Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">API Key / Token</label>
                  <div className="relative">
                    <input
                      type={showKeys ? 'text' : 'password'}
                      value={apiKeys[platform.id as keyof typeof apiKeys]}
                      onChange={(e) => handleKeyChange(platform.id, e.target.value)}
                      placeholder={platform.placeholder}
                      className={`w-full px-4 py-3 pr-20 rounded-lg border ${inputClass} placeholder-white/30`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                      <button
                        onClick={() => setShowKeys(!showKeys)}
                        className="p-1 text-white/50 hover:text-white/80"
                      >
                        {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {apiKeys[platform.id as keyof typeof apiKeys] && (
                        <button
                          onClick={() => testAPI(platform.id)}
                          className="p-1 text-green-400 hover:text-green-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {platform.id === 'telegram' && (
                  <div className={`${theme === 'professional' ? 'bg-blue-900/20' : 'bg-blue-500/10'} rounded-lg p-4 border border-blue-500/30`}>
                    <div className="flex items-start space-x-3">
                      <MessageCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h6 className="text-blue-300 font-medium">Quick Telegram Setup</h6>
                        <p className="text-blue-200/80 text-sm mt-1">
                          This is the fastest way to get real-time follower data. Takes 2 minutes and is completely free!
                        </p>
                        <button
                          onClick={() => copyToClipboard('https://t.me/BotFather', 'BotFather link')}
                          className="mt-2 text-blue-300 hover:text-blue-200 text-sm flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open @BotFather in Telegram</span>
                          {copied === 'BotFather link' && <Check className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Setup Steps */}
              <div>
                <h5 className="text-white/70 text-sm mb-3">Setup Steps:</h5>
                <div className="space-y-3">
                  {platform.steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        platform.priority === 'HIGH' 
                          ? 'bg-red-500/20 text-red-300' 
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-white/70 text-sm">{step}</span>
                    </div>
                  ))}
                </div>

                {platform.id === 'rapidapi' && (
                  <button
                    onClick={() => copyToClipboard('https://rapidapi.com', 'RapidAPI link')}
                    className="mt-4 w-full px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-300 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open RapidAPI.com</span>
                    {copied === 'RapidAPI link' && <Check className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Status */}
      <div className={`${cardClass} p-6`}>
        <h4 className="text-white font-semibold mb-4">Integration Status</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70">Telegram Channels</span>
            <span className={currentStatus.telegram === 'CONFIGURED' ? 'text-green-300' : 'text-yellow-300'}>
              {currentStatus.telegram === 'CONFIGURED' ? '✅ Real-time data' : '⚠️ Using estimates'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70">YouTube Channels</span>
            <span className={currentStatus.rapidapi === 'CONFIGURED' || currentStatus.google === 'CONFIGURED' ? 'text-green-300' : 'text-yellow-300'}>
              {currentStatus.rapidapi === 'CONFIGURED' || currentStatus.google === 'CONFIGURED' ? '✅ Real-time data' : '⚠️ Using estimates'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70">Instagram/TikTok/Twitter</span>
            <span className={currentStatus.rapidapi === 'CONFIGURED' ? 'text-green-300' : 'text-yellow-300'}>
              {currentStatus.rapidapi === 'CONFIGURED' ? '✅ Real-time data' : '⚠️ Using estimates'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaAPIConfig;
