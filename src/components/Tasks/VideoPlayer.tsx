import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, CheckCircle, AlertCircle } from 'lucide-react';
import { Task } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';

interface VideoPlayerProps {
  task: Task;
  onComplete: (earnings: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ task, onComplete }) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(task.duration || 180);
  const [isMuted, setIsMuted] = useState(true);
  const [canComplete, setCanComplete] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const requiredWatchTime = (duration * (task.requiredWatchPercentage || 80)) / 100;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      setVideoError(false);
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      
      if (time >= requiredWatchTime && !canComplete) {
        setCanComplete(true);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentTime >= requiredWatchTime) {
        setCanComplete(true);
      }
    };

    const handleError = () => {
      setVideoError(true);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setVideoError(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [requiredWatchTime, canComplete, currentTime]);

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video || videoError) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        await video.play();
      }
    } catch (error) {
      console.error('Video playback error:', error);
      setVideoError(true);
    }
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleComplete = () => {
    if (canComplete) {
      onComplete(task.reward);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = seekTime;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const requiredPercentage = duration > 0 ? (requiredWatchTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-black rounded-lg overflow-hidden">
        {/* Real Video Player */}
        <div className="aspect-video relative">
          {videoError ? (
            <div className="w-full h-full bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center">
              <div className="text-center text-white">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
                <h3 className="text-lg font-medium mb-2">Video Not Available</h3>
                <p className="text-red-200 text-sm mb-4">
                  The video URL may be invalid or the server is not accessible
                </p>
                <p className="text-red-300 text-xs">URL: {task.url}</p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={task.url}
              className="w-full h-full object-cover"
              muted={isMuted}
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
            />
          )}
          
          {/* Loading Overlay */}
          {isLoading && !videoError && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}
          
          {/* Play/Pause Overlay */}
          {!isLoading && !videoError && (
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 bg-black/20 hover:bg-black/30 transition-colors flex items-center justify-center"
            >
              {!isPlaying && (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
              )}
              <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          )}
        </div>
        
        {/* Video Controls */}
        <div className="bg-black/90 p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              disabled={videoError || isLoading}
              className="text-white hover:text-purple-300 transition-colors disabled:text-gray-500"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleMuteToggle}
              disabled={videoError || isLoading}
              className="text-white hover:text-purple-300 transition-colors disabled:text-gray-500"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            <div className="flex-1">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercentage}
                  onChange={handleSeek}
                  disabled={videoError || isLoading}
                  className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${progressPercentage}%, rgba(255,255,255,0.2) ${progressPercentage}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
                {/* Required watch marker */}
                <div 
                  className="absolute top-0 w-1 h-2 bg-yellow-400 rounded-full pointer-events-none"
                  style={{ left: `${requiredPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <span className="text-white text-sm min-w-max">
              {formatTime(Math.floor(currentTime))} / {formatTime(Math.floor(duration))}
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
