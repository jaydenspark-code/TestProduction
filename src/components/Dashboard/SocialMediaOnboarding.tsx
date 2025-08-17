import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MessageCircle, Youtube, ExternalLink, Check, Gift, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SocialPlatform {
  id: 'telegram' | 'youtube';
  name: string;
  icon: React.ReactNode;
  link: string;
  reward: number;
  description: string;
  requirement: string;
}

const SocialMediaOnboarding: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [completedPlatforms, setCompletedPlatforms] = useState<string[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [processing, setProcessing] = useState<string | null>(null);

  const platforms: SocialPlatform[] = [
    {
      id: 'telegram',
      name: 'Telegram Channel',
      icon: <MessageCircle className="w-6 h-6" />,
      link: 'https://t.me/earnpro_official', // Replace with your actual Telegram link
      reward: 0.25,
      description: 'Join our official Telegram channel for updates and community',
      requirement: 'Join channel and stay active'
    },
    {
      id: 'youtube',
      name: 'YouTube Channel',
      icon: <Youtube className="w-6 h-6" />,
      link: 'https://youtube.com/@earnpro_official', // Replace with your actual YouTube link
      reward: 0.25,
      description: 'Subscribe to our YouTube channel for tutorials and updates',
      requirement: 'Subscribe and ring the notification bell'
    }
  ];

  useEffect(() => {
    loadCompletedPlatforms();
  }, [user]);

  const loadCompletedPlatforms = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('social_media_tasks')
        .select('platform')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (error) {
        console.error('Error loading completed platforms:', error);
        return;
      }

      const completed = data?.map((item: any) => item.platform) || [];
      setCompletedPlatforms(completed);
      setTotalEarned(completed.length * 0.25);
    } catch (error) {
      console.error('Error loading social media progress:', error);
    }
  };

  const handlePlatformJoin = async (platform: SocialPlatform) => {
    if (!user || completedPlatforms.includes(platform.id)) return;

    // Open the platform link
    window.open(platform.link, '_blank');

    // Show confirmation after a delay
    setTimeout(async () => {
      const confirmed = window.confirm(
        `Have you successfully joined/subscribed to our ${platform.name}? Click OK to confirm and earn your reward!`
      );

      if (confirmed) {
        await completePlatformTask(platform);
      }
    }, 3000); // 3 second delay to allow user to join
  };

  const completePlatformTask = async (platform: SocialPlatform) => {
    if (!user) return;

    setProcessing(platform.id);

    try {
      // Record the social media task completion
      const { error: taskError } = await supabase
        .from('social_media_tasks')
        .insert({
          user_id: user.id,
          platform: platform.id,
          platform_name: platform.name,
          reward_amount: platform.reward,
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (taskError) {
        console.error('Error recording platform task:', taskError);
        throw taskError;
      }

      // Update user balance
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('balance, total_earned')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current user:', fetchError);
        throw fetchError;
      }

      const newBalance = (currentUser.balance || 0) + platform.reward;
      const newTotalEarned = (currentUser.total_earned || 0) + platform.reward;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          balance: newBalance,
          total_earned: newTotalEarned
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user balance:', updateError);
        throw updateError;
      }

      // Log the earning transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'social_media_bonus',
          amount: platform.reward,
          description: `${platform.name} joining bonus`,
          reference: `SOCIAL-${platform.id.toUpperCase()}-${user.id}-${Date.now()}`,
          status: 'completed'
        });

      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }

      // Update local state
      setCompletedPlatforms(prev => [...prev, platform.id]);
      setTotalEarned(prev => prev + platform.reward);

      // Refresh user data
      await refreshUser();

    } catch (error) {
      console.error('Error completing platform task:', error);
      alert('Failed to complete task. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const buttonClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  const completedButtonClass = theme === 'professional'
    ? 'bg-gray-600/50 border border-gray-500/50 text-gray-300'
    : 'bg-green-600/20 border border-green-500/50 text-green-300';

  return (
    <div className={`${cardClass} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Join Our Community</h3>
          <p className="text-white/70">Connect with us and earn your first rewards!</p>
        </div>
        <div className="text-right">
          <div className="flex items-center text-green-400 font-medium">
            <DollarSign className="w-4 h-4 mr-1" />
            <span>${totalEarned.toFixed(2)}</span>
          </div>
          <p className="text-white/60 text-sm">Earned</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((platform) => {
          const isCompleted = completedPlatforms.includes(platform.id);
          const isProcessing = processing === platform.id;

          return (
            <div key={platform.id} className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${theme === 'professional' ? 'bg-cyan-500/20' : 'bg-purple-500/20'}`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{platform.name}</h4>
                    <div className="flex items-center text-green-400 text-sm">
                      <Gift className="w-3 h-3 mr-1" />
                      <span>+${platform.reward.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {isCompleted && (
                  <div className="p-1 rounded-full bg-green-500/20">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                )}
              </div>

              <p className="text-white/70 text-sm mb-2">{platform.description}</p>
              <p className="text-white/50 text-xs mb-4">{platform.requirement}</p>

              <button
                onClick={() => handlePlatformJoin(platform)}
                disabled={isCompleted || isProcessing}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isCompleted 
                    ? completedButtonClass 
                    : `${buttonClass} text-white hover:scale-105`
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCompleted ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Completed</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>Join & Earn</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {completedPlatforms.length === platforms.length && (
        <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
          <div className="flex items-center justify-center text-green-400 mb-2">
            <Gift className="w-5 h-5 mr-2" />
            <span className="font-medium">All Platforms Joined!</span>
          </div>
          <p className="text-white/80 text-sm">
            Great job! You've earned ${totalEarned.toFixed(2)} from social media onboarding.
          </p>
        </div>
      )}
    </div>
  );
};

export default SocialMediaOnboarding;
