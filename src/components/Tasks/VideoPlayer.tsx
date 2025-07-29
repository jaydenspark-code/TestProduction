import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, CheckCircle } from 'lucide-react';
import { Task } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';

interface VideoPlayerProps {
  task: Task;
  onComplete: (earnings: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ task, onComplete }) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [canComplete, setCanComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const duration = task.duration || 180;
  const requiredWatchTime = (duration * (task.requiredWatchPercentage || 80)) / 100;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= requiredWatchTime && !canComplete) {
            setCanComplete(true);
          }
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, requiredWatchTime, duration, canComplete]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleComplete = () => {
    if (canComplete) {
      onComplete(task.reward);
    }
  };

  const progressPercentage = (currentTime / duration) * 100;
  const requiredPercentage = (requiredWatchTime / duration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-black rounded-lg overflow-hidden">
        {/* Simulated Video Player */}
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
              {isPlaying ? (
                <Pause className="w-10 h-10 text-white" />
              ) : (
                <Play className="w-10 h-10 text-white ml-1" />
              )}
            </div>
            <p className="text-white/70">Simulated Video Player</p>
            <p className="text-white/50 text-sm">{task.title}</p>
          </div>
          
          {/* Play/Pause Overlay */}
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 bg-black/20 hover:bg-black/30 transition-colors"
          >
            <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
        </div>
        
        {/* Video Controls */}
        <div className="bg-black/50 p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="text-white hover:text-purple-300 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:text-purple-300 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            <div className="flex-1">
              <div className="relative">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                  {/* Required watch marker */}
                  <div 
                    className="absolute top-0 w-1 h-2 bg-yellow-400 rounded-full"
                    style={{ left: `${requiredPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Info */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white font-medium">Watch Progress</span>
          <span className="text-white">{Math.round(progressPercentage)}%</span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-3 mb-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              currentTime >= requiredWatchTime ? 'bg-green-500' : 'bg-purple-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-white/70">
            Required: {task.requiredWatchPercentage}% ({formatTime(requiredWatchTime)})
          </span>
          <span className={`${canComplete ? 'text-green-300' : 'text-white/70'}`}>
            {canComplete ? 'Ready to claim!' : `${formatTime(Math.max(0, requiredWatchTime - currentTime))} remaining`}
          </span>
        </div>
      </div>

      {/* Reward Info */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Task Reward</h4>
            <p className="text-white/70 text-sm">Complete watching to earn</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-300">
              +{formatCurrency(task.reward, user?.currency || 'USD')}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={!canComplete}
        className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
          canComplete
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
            : 'bg-white/10 text-white/50 cursor-not-allowed'
        }`}
      >
        {canComplete ? (
          <span className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Claim Reward</span>
          </span>
        ) : (
          `Watch ${task.requiredWatchPercentage}% to unlock reward`
        )}
      </button>
    </div>
  );
};

export default VideoPlayer;
