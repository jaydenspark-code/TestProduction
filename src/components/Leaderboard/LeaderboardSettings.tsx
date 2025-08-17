import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaderboardService } from '../../services/leaderboardService';
import { UserRanking } from '../../types/leaderboard';
import { Eye, EyeOff, Shield, Trophy } from 'lucide-react';

const LeaderboardSettings: React.FC = () => {
  const { user } = useAuth();
  const [regularOptIn, setRegularOptIn] = useState(true);
  const [agentOptIn, setAgentOptIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [regularRanking, agentRanking] = await Promise.all([
        leaderboardService.getUserRanking(user.id, 'regular'),
        leaderboardService.getUserRanking(user.id, 'agent')
      ]);

      setRegularOptIn(regularRanking?.optIn ?? true);
      setAgentOptIn(agentRanking?.optIn ?? true);
    } catch (error) {
      console.error('Error loading leaderboard settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOptIn = async (category: 'regular' | 'agent') => {
    if (!user || saving) return;

    try {
      setSaving(true);
      const newValue = category === 'regular' ? !regularOptIn : !agentOptIn;
      const success = await leaderboardService.updateOptInStatus(user.id, category, newValue);

      if (success) {
        if (category === 'regular') {
          setRegularOptIn(newValue);
        } else {
          setAgentOptIn(newValue);
        }
      }
    } catch (error) {
      console.error('Error updating leaderboard settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Leaderboard Settings</h2>
          <p className="text-gray-400 mt-1">Manage your visibility on the leaderboards</p>
        </div>
        <Trophy className="w-8 h-8 text-purple-400" />
      </div>

      <div className="space-y-4">
        {/* Regular User Leaderboard Settings */}
        <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Regular User Leaderboard</h3>
              <p className="text-gray-400 text-sm">
                Show your ranking among other regular users
              </p>
            </div>
            <button
              onClick={() => handleToggleOptIn('regular')}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${regularOptIn ? 'bg-purple-500' : 'bg-gray-600'}`}
            >
              <span className="sr-only">Toggle regular leaderboard visibility</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${regularOptIn ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-400">
            {regularOptIn ? (
              <>
                <Eye className="w-4 h-4" />
                <span>Your profile is visible on the regular user leaderboard</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Your profile is hidden from the regular user leaderboard</span>
              </>
            )}
          </div>
        </div>

        {/* Agent Leaderboard Settings */}
        {user?.isAgent && (
          <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">Agent Leaderboard</h3>
                <p className="text-gray-400 text-sm">
                  Show your ranking among other agents
                </p>
              </div>
              <button
                onClick={() => handleToggleOptIn('agent')}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${agentOptIn ? 'bg-purple-500' : 'bg-gray-600'}`}
              >
                <span className="sr-only">Toggle agent leaderboard visibility</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${agentOptIn ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-400">
              {agentOptIn ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Your profile is visible on the agent leaderboard</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Your profile is hidden from the agent leaderboard</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-6 flex items-start space-x-3 text-sm text-gray-400">
          <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            Your privacy matters to us. When you opt out of the leaderboard, your ranking and stats will be hidden from other users, but you'll still be able to see your own position and track your progress.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardSettings;