import React, { useState } from 'react';
import { ExternalLink, CheckCircle, MessageCircle } from 'lucide-react';
import { Task } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';

interface TelegramTaskProps {
  task: Task;
  onComplete: (earnings: number) => void;
}

const TelegramTask: React.FC<TelegramTaskProps> = ({ task, onComplete }) => {
  const { user } = useAuth();
  const [hasJoined, setHasJoined] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleJoinChannel = () => {
    if (task.url) {
      window.open(task.url, '_blank');
      setHasJoined(true);
    }
  };

  const handleVerifyJoin = async () => {
    setIsVerifying(true);
    
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsVerifying(false);
    onComplete(task.reward);
  };

  return (
    <div className="space-y-6">
      {/* Task Instructions */}
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <div className="flex items-center mb-4">
          <MessageCircle className="w-8 h-8 text-blue-400 mr-3" />
          <h4 className="text-white font-medium text-lg">Telegram Channel Task</h4>
        </div>
        
        <p className="text-white/70 mb-4">{task.description}</p>
        
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h5 className="text-blue-300 font-medium mb-2">Instructions:</h5>
          <ol className="text-white/70 text-sm space-y-1 list-decimal list-inside">
            <li>Click "Join Channel" to open Telegram</li>
            <li>Join the specified channel</li>
            <li>Return here and click "Verify Join"</li>
            <li>Claim your reward!</li>
          </ol>
        </div>
      </div>

      {/* Channel Info */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-white font-medium">Channel to Join</h5>
            <p className="text-white/70 text-sm">{task.url}</p>
          </div>
          <ExternalLink className="w-5 h-5 text-white/50" />
        </div>
      </div>

      {/* Reward Info */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Task Reward</h4>
            <p className="text-white/70 text-sm">Join the channel to earn</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-300">
              +{formatCurrency(task.reward, user?.currency || 'USD')}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleJoinChannel}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Join Channel</span>
          <ExternalLink className="w-4 h-4" />
        </button>

        <button
          onClick={handleVerifyJoin}
          disabled={!hasJoined || isVerifying}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
            hasJoined && !isVerifying
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
          }`}
        >
          {isVerifying ? (
            <span className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Verifying...</span>
            </span>
          ) : hasJoined ? (
            <span className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Verify Join & Claim Reward</span>
            </span>
          ) : (
            'Join channel first to verify'
          )}
        </button>
      </div>

      {/* Note */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
        <p className="text-yellow-300 text-sm">
          <strong>Note:</strong> Make sure you actually join the channel. Our system may verify your membership.
        </p>
      </div>
    </div>
  );
};

export default TelegramTask;
