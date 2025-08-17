import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Copy, Share2, QrCode, Users, DollarSign, Check, ExternalLink } from 'lucide-react';
import QRCodeGenerator from '../QRCode/QRCodeGenerator';
import { supabase } from '../../lib/supabase';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingReferrals: number;
  recentReferrals: Array<{
    id: string;
    email: string;
    joinedAt: string;
    status: 'pending' | 'active';
    earnings: number;
  }>;
}

const ReferralSystem: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateReferralData();
      loadReferralStats();
    }
  }, [user]);

  const generateReferralData = async () => {
    if (!user) return;

    try {
      // Check if user already has a referral code
      const { data: existingCode, error: codeError } = await supabase
        .from('user_referrals')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      let referralCode;

      if (existingCode?.referral_code) {
        referralCode = existingCode.referral_code;
      } else {
        // Generate new referral code
        referralCode = `EP${user.id.slice(0, 8).toUpperCase()}`;
        
        // Store in database
        const { error: insertError } = await supabase
          .from('user_referrals')
          .insert({
            user_id: user.id,
            referral_code: referralCode,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error storing referral code:', insertError);
        }
      }

      const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

      setReferralData(prev => ({
        ...prev,
        referralCode,
        referralLink,
        totalReferrals: prev?.totalReferrals || 0,
        totalEarnings: prev?.totalEarnings || 0,
        pendingReferrals: prev?.pendingReferrals || 0,
        recentReferrals: prev?.recentReferrals || []
      }));

    } catch (error) {
      console.error('Error generating referral data:', error);
    }
  };

  const loadReferralStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get referral statistics
      const { data: referrals, error: referralError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_user:users!referrals_referred_user_id_fkey(email, created_at, is_paid)
        `)
        .eq('referrer_id', user.id);

      if (referralError) {
        console.error('Error loading referral stats:', referralError);
        return;
      }

      // Calculate stats
      const totalReferrals = referrals?.length || 0;
      const activeReferrals = referrals?.filter((ref: any) => ref.referred_user?.is_paid) || [];
      const pendingReferrals = referrals?.filter((ref: any) => !ref.referred_user?.is_paid) || [];

      // Calculate total earnings from referrals
      const totalEarnings = referrals?.reduce((sum: number, ref: any) => {
        return sum + (ref.commission_earned || 0);
      }, 0) || 0;

      // Format recent referrals
      const recentReferrals = referrals?.slice(0, 5).map((ref: any) => ({
        id: ref.id,
        email: ref.referred_user?.email || 'Unknown',
        joinedAt: ref.created_at,
        status: ref.referred_user?.is_paid ? 'active' : 'pending',
        earnings: ref.commission_earned || 0
      })) || [];

      setReferralData(prev => ({
        ...prev!,
        totalReferrals,
        totalEarnings,
        pendingReferrals: pendingReferrals.length,
        recentReferrals
      }));

    } catch (error) {
      console.error('Error loading referral statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralData?.referralLink) return;

    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const shareReferralLink = async () => {
    if (!referralData?.referralLink) return;

    const shareText = `🚀 Join EarnPro and start earning money online! Use my referral link to get started: ${referralData.referralLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join EarnPro - Start Earning Online',
          text: shareText,
          url: referralData.referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy
      await copyReferralLink();
    }
  };

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const buttonClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  if (loading || !referralData) {
    return (
      <div className={`${cardClass} p-6`}>
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="h-4 bg-white/10 rounded mb-2"></div>
          <div className="h-4 bg-white/10 rounded mb-4"></div>
          <div className="h-10 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardClass} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Your Referral System</h3>
          <p className="text-white/70">Share your link and earn from every referral</p>
        </div>
        <div className="text-right">
          <div className="flex items-center text-green-400 font-bold text-lg">
            <DollarSign className="w-5 h-5 mr-1" />
            <span>${referralData.totalEarnings.toFixed(2)}</span>
          </div>
          <p className="text-white/60 text-sm">Total Earned</p>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 text-center`}>
          <div className="text-2xl font-bold text-white">{referralData.totalReferrals}</div>
          <div className="text-white/60 text-sm">Total Referrals</div>
        </div>
        <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 text-center`}>
          <div className="text-2xl font-bold text-green-400">{referralData.totalReferrals - referralData.pendingReferrals}</div>
          <div className="text-white/60 text-sm">Active</div>
        </div>
        <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 text-center`}>
          <div className="text-2xl font-bold text-yellow-400">{referralData.pendingReferrals}</div>
          <div className="text-white/60 text-sm">Pending</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-6">
        <label className="block text-white font-medium mb-2">Your Referral Link:</label>
        <div className="flex items-center space-x-2">
          <div className={`flex-1 ${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/5'} rounded-lg p-3 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
            <code className="text-white/90 text-sm break-all">{referralData.referralLink}</code>
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

      {/* QR Code */}
      {showQR && (
        <div className="mb-6 text-center">
          <QRCodeGenerator value={referralData.referralLink} size={200} />
          <p className="text-white/70 text-sm mt-2">Scan to join with your referral link</p>
        </div>
      )}

      {/* Referral Code */}
      <div className="mb-6">
        <label className="block text-white font-medium mb-2">Your Referral Code:</label>
        <div className={`${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/5'} rounded-lg p-3 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'} text-center`}>
          <code className="text-2xl font-bold text-white tracking-wider">{referralData.referralCode}</code>
        </div>
      </div>

      {/* Recent Referrals */}
      {referralData.recentReferrals.length > 0 && (
        <div>
          <h4 className="text-white font-medium mb-3">Recent Referrals</h4>
          <div className="space-y-2">
            {referralData.recentReferrals.map((referral) => (
              <div
                key={referral.id}
                className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-3 flex items-center justify-between`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    referral.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">
                      {referral.email.replace(/(.{3}).*(@.*)/, '$1***$2')}
                    </div>
                    <div className="text-white/60 text-xs">
                      {new Date(referral.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-medium text-sm">
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

      {/* Earning Information */}
      <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
        <h4 className="text-blue-300 font-medium mb-2">💡 How Referral Earnings Work:</h4>
        <ul className="text-white/70 text-sm space-y-1">
          <li>• Earn commission when referred users activate their accounts</li>
          <li>• Get ongoing earnings from their platform activities</li>
          <li>• Multi-level earning potential from indirect referrals</li>
          <li>• All earnings are automatically added to your balance</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferralSystem;
