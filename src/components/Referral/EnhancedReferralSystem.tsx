import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Copy, 
  Share2, 
  QrCode, 
  Download, 
  Users, 
  DollarSign, 
  TrendingUp,
  Gift,
  ExternalLink,
  Check,
  Trophy,
  Target
} from 'lucide-react';
import QRCodeGenerator from '../QRCode/QRCodeGenerator';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';

interface ReferralStats {
  directReferrals: number;
  level2Referrals: number;
  level3Referrals: number;
  level1Earnings: number;
  level2Earnings: number;
  level3Earnings: number;
  totalEarnings: number;
  pendingReferrals: number;
  thisWeekReferrals: number;
  conversionRate: number;
}

interface RecentReferral {
  id: string;
  email: string;
  joinedAt: string;
  status: 'pending' | 'active';
  level: 1 | 2 | 3;
  earnings: number;
}

const EnhancedReferralSystem: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<ReferralStats>({
    directReferrals: 0,
    level2Referrals: 0,
    level3Referrals: 0,
    level1Earnings: 0,
    level2Earnings: 0,
    level3Earnings: 0,
    totalEarnings: 0,
    pendingReferrals: 0,
    thisWeekReferrals: 0,
    conversionRate: 0
  });
  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([]);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const referralLink = `https://earnpro.org/register?ref=${user?.referralCode}`;

  const loadReferralData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get enhanced referral stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_enhanced_referral_stats', { user_uuid: user.id });

      if (statsError) {
        console.error('Error loading referral stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        const stat = statsData[0];
        setStats({
          directReferrals: stat.total_referrals || 0,
          level2Referrals: 0, // Will be calculated from chain
          level3Referrals: 0, // Will be calculated from chain
          level1Earnings: parseFloat(stat.level1_earnings || '0'),
          level2Earnings: parseFloat(stat.level2_earnings || '0'),
          level3Earnings: parseFloat(stat.level3_earnings || '0'),
          totalEarnings: parseFloat(stat.total_earnings || '0'),
          pendingReferrals: stat.pending_referrals || 0,
          thisWeekReferrals: 0, // Calculate from date range
          conversionRate: stat.total_referrals > 0 ? (stat.active_referrals / stat.total_referrals) * 100 : 0
        });
      }

      // Get recent referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          commission_earned,
          created_at,
          referred_user:users!referrals_referred_user_id_fkey(email)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (referralsError) {
        console.error('Error loading recent referrals:', referralsError);
      } else {
        const formatted = referralsData?.map((ref: any) => ({
          id: ref.id,
          email: ref.referred_user?.email || 'Unknown',
          joinedAt: ref.created_at,
          status: ref.status === 'active' ? 'active' : 'pending',
          level: 1, // Direct referrals are level 1
          earnings: parseFloat(ref.commission_earned || '0')
        })) || [];
        setRecentReferrals(formatted);
      }

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      showToast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast.error('Failed to copy referral link');
    }
  };

  const shareReferralLink = async () => {
    const shareText = `🚀 Join EarnPro and start earning money online! 

💰 What you get:
• $3 instant welcome bonus
• Earn $1.50 for each person you refer
• Multi-level earning potential
• Daily tasks worth $1+ 
• Social media rewards

Use my referral link: ${referralLink}

Start earning today! 💪`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join EarnPro - Start Earning Online',
          text: shareText,
          url: referralLink,
        });
      } catch (error) {
        await copyReferralLink();
      }
    } else {
      await copyReferralLink();
    }
  };

  const downloadQRCode = () => {
    // This would implement QR code download functionality
    showToast.success('QR Code download feature coming soon!');
  };

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const buttonClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  const accentColor = theme === 'professional' ? 'text-cyan-400' : 'text-purple-400';

  if (loading) {
    return (
      <div className={`${cardClass} p-6 animate-pulse`}>
        <div className="h-6 bg-white/10 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/10 rounded"></div>
          ))}
        </div>
        <div className="h-12 bg-white/10 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Total Earnings */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Referral System</h3>
            <p className="text-white/70">Share your link and earn from multi-level referrals</p>
          </div>
          <div className="text-right">
            <div className={`flex items-center ${accentColor} font-bold text-2xl`}>
              <DollarSign className="w-6 h-6 mr-1" />
              <span>{stats.totalEarnings.toFixed(2)}</span>
            </div>
            <p className="text-white/60 text-sm">Total Referral Earnings</p>
          </div>
        </div>

        {/* Multi-Level Earnings Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`${theme === 'professional' ? 'bg-gradient-to-br from-green-600/20 to-green-700/10' : 'bg-gradient-to-br from-green-500/20 to-green-600/10'} rounded-lg p-4 border border-green-500/20`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">${stats.level1Earnings.toFixed(2)}</div>
              <div className="text-white/80 text-sm">Level 1 ($1.50 each)</div>
              <div className="text-white/60 text-xs">{stats.directReferrals} referrals</div>
            </div>
          </div>
          <div className={`${theme === 'professional' ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/10' : 'bg-gradient-to-br from-blue-500/20 to-blue-600/10'} rounded-lg p-4 border border-blue-500/20`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">${stats.level2Earnings.toFixed(2)}</div>
              <div className="text-white/80 text-sm">Level 2 ($1.00 each)</div>
              <div className="text-white/60 text-xs">{stats.level2Referrals} referrals</div>
            </div>
          </div>
          <div className={`${theme === 'professional' ? 'bg-gradient-to-br from-purple-600/20 to-purple-700/10' : 'bg-gradient-to-br from-purple-500/20 to-purple-600/10'} rounded-lg p-4 border border-purple-500/20`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">${stats.level3Earnings.toFixed(2)}</div>
              <div className="text-white/80 text-sm">Level 3 ($0.50 each)</div>
              <div className="text-white/60 text-xs">{stats.level3Referrals} referrals</div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-3 text-center`}>
            <div className="text-lg font-bold text-white">{stats.pendingReferrals}</div>
            <div className="text-white/60 text-xs">Pending</div>
          </div>
          <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-3 text-center`}>
            <div className="text-lg font-bold text-white">{stats.thisWeekReferrals}</div>
            <div className="text-white/60 text-xs">This Week</div>
          </div>
          <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-3 text-center`}>
            <div className="text-lg font-bold text-white">{stats.conversionRate.toFixed(1)}%</div>
            <div className="text-white/60 text-xs">Conversion</div>
          </div>
          <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-3 text-center`}>
            <div className="text-lg font-bold text-white">{(stats.totalEarnings / Math.max(stats.directReferrals, 1)).toFixed(2)}</div>
            <div className="text-white/60 text-xs">Avg/Referral</div>
          </div>
        </div>

        {/* Referral Link Section */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">Your Referral Link:</label>
          <div className="flex items-center space-x-2">
            <div className={`flex-1 ${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/5'} rounded-lg p-3 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
              <code className="text-white/90 text-sm break-all">{referralLink}</code>
            </div>
            <button
              onClick={copyReferralLink}
              className={`${buttonClass} text-white p-3 rounded-lg transition-all duration-200 hover:scale-105`}
              title="Copy Link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={shareReferralLink}
              className={`${buttonClass} text-white p-3 rounded-lg transition-all duration-200 hover:scale-105`}
              title="Share Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className={`${buttonClass} text-white p-3 rounded-lg transition-all duration-200 hover:scale-105`}
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        {showQR && (
          <div className="mb-6 text-center p-6 bg-white/5 rounded-lg border border-white/10">
            <QRCodeGenerator value={referralLink} size={200} />
            <p className="text-white/70 text-sm mt-4">Scan to join EarnPro with your referral</p>
            <button
              onClick={downloadQRCode}
              className={`${buttonClass} text-white px-4 py-2 rounded-lg text-sm mt-3 inline-flex items-center space-x-2`}
            >
              <Download className="w-4 h-4" />
              <span>Download QR Code</span>
            </button>
          </div>
        )}

        {/* Referral Code Display */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-2">Your Referral Code:</label>
          <div className={`${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/5'} rounded-lg p-4 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'} text-center`}>
            <code className="text-3xl font-bold text-white tracking-wider">{user?.referralCode}</code>
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      {recentReferrals.length > 0 && (
        <div className={`${cardClass} p-6`}>
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Recent Referrals
          </h4>
          <div className="space-y-3">
            {recentReferrals.slice(0, 5).map((referral) => (
              <div
                key={referral.id}
                className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 flex items-center justify-between`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    referral.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">
                      {referral.email.replace(/(.{3}).*(@.*)/, '$1***$2')}
                    </div>
                    <div className="text-white/60 text-xs">
                      {new Date(referral.joinedAt).toLocaleDateString()} • Level {referral.level}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-sm">
                    +${referral.earnings.toFixed(2)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    referral.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {referral.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earning Tips */}
      <div className={`${cardClass} p-6`}>
        <h4 className="text-lg font-bold text-white mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Maximize Your Referral Earnings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-400 text-xs font-bold">1</span>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Level 1: Direct Referrals</div>
                <div className="text-white/70 text-xs">Earn $1.50 for each person you directly refer</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">2</span>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Level 2: Indirect Referrals</div>
                <div className="text-white/70 text-xs">Earn $1.00 when your referrals refer others</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 text-xs font-bold">3</span>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Level 3: Deep Network</div>
                <div className="text-white/70 text-xs">Earn $0.50 from third-level referrals</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium text-sm">Share on Social Media</div>
                <div className="text-white/70 text-xs">Use your QR code and referral link on all platforms</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Gift className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium text-sm">Explain the Benefits</div>
                <div className="text-white/70 text-xs">Tell people about the $3 welcome bonus and earning potential</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium text-sm">Build Your Network</div>
                <div className="text-white/70 text-xs">Focus on quality referrals who will stay active</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedReferralSystem;
