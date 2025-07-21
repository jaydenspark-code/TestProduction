import React from 'react';
import { X, Palette, Monitor, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${theme === 'professional' ? 'bg-gray-800/90' : 'bg-white/10'} backdrop-blur-lg rounded-2xl p-6 border ${theme === 'professional' ? 'border-gray-700/50' : 'border-white/20'} max-w-md w-full`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Palette className="w-6 h-6 mr-2" />
            Settings
          </h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-white font-medium mb-4">Theme Selection</h4>
            <div className="space-y-3">
              <button
                onClick={() => setTheme('classic')}
                className={`w-full p-4 rounded-lg border transition-all duration-200 ${
                  theme === 'classic'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">EarnPro Classic</div>
                    <div className="text-white/70 text-sm">Vibrant purple & blue gradients</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setTheme('professional')}
                className={`w-full p-4 rounded-lg border transition-all duration-200 ${
                  theme === 'professional'
                    ? 'border-cyan-500 bg-cyan-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center">
                    <Moon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">EarnPro Professional</div>
                    <div className="text-white/70 text-sm">Dark theme with cyan accents</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
            <h5 className="text-white font-medium mb-2">Theme Features</h5>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• Unique visual design for each theme</li>
              <li>• Consistent functionality across themes</li>
              <li>• Automatic theme persistence</li>
              <li>• Enhanced user experience</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 ${theme === 'professional' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} text-white rounded-lg transition-all duration-200`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;