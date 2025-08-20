import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Play, CheckCircle, Lock, Clock, DollarSign, Calendar, MessageCircle, ExternalLink } from 'lucide-react';
import { Task, TaskProgress } from '../../types';
import { formatDualCurrencySync } from '../../utils/currency';
import VideoPlayer from './VideoPlayer';
import TelegramTask from './TelegramTask';

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskProgress, setTaskProgress] = useState<{ [key: string]: TaskProgress }>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    // Initialize comprehensive weekly tasks
    const weeklyTasks: Task[] = [
      // Monday Tasks (10 tasks)
      { id: 'mon-1', title: 'Welcome to EarnPro', description: 'Watch our introduction video', type: 'video', reward: 2.50, duration: 180, url: 'https://www.youtube.com/watch?v=jq1qecZ7UNw', requiredWatchPercentage: 80, isCompleted: false, isLocked: false, dayOfWeek: 1, order: 1 },
      { id: 'mon-2', title: 'Join EarnPro Community', description: 'Join our official Telegram channel', type: 'telegram', reward: 1.50, url: 'https://t.me/earnpro_official', isCompleted: false, isLocked: true, dayOfWeek: 1, order: 2 },
      { id: 'mon-3', title: 'Platform Overview', description: 'Learn about EarnPro features', type: 'video', reward: 3.00, duration: 240, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: true, dayOfWeek: 1, order: 3 },
      { id: 'mon-4', title: 'Join Updates Channel', description: 'Stay updated with latest news', type: 'telegram', reward: 1.25, url: 'https://t.me/earnpro_updates', isCompleted: false, isLocked: true, dayOfWeek: 1, order: 4 },
      { id: 'mon-5', title: 'Referral System Guide', description: 'Master the referral system', type: 'video', reward: 2.75, duration: 200, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: true, dayOfWeek: 1, order: 5 },
      { id: 'mon-6', title: 'Success Stories Channel', description: 'Get inspired by success stories', type: 'telegram', reward: 1.75, url: 'https://t.me/earnpro_success', isCompleted: false, isLocked: true, dayOfWeek: 1, order: 6 },
      { id: 'mon-7', title: 'Earning Strategies', description: 'Learn advanced earning techniques', type: 'video', reward: 3.25, duration: 300, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: true, dayOfWeek: 1, order: 7 },
      { id: 'mon-8', title: 'Support Channel', description: 'Join our support community', type: 'telegram', reward: 1.00, url: 'https://t.me/earnpro_support', isCompleted: false, isLocked: true, dayOfWeek: 1, order: 8 },
      { id: 'mon-9', title: 'Payment Methods', description: 'Understand payment options', type: 'video', reward: 2.25, duration: 150, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: true, dayOfWeek: 1, order: 9 },
      { id: 'mon-10', title: 'VIP Members Group', description: 'Join exclusive VIP group', type: 'telegram', reward: 2.00, url: 'https://t.me/earnpro_vip', isCompleted: false, isLocked: true, dayOfWeek: 1, order: 10 },

      // Tuesday Tasks (10 tasks)
      { id: 'tue-1', title: 'Advanced Referrals', description: 'Multi-level referral strategies', type: 'video', reward: 3.50, duration: 280, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: false, dayOfWeek: 2, order: 1 },
      { id: 'tue-2', title: 'Marketing Tips Channel', description: 'Learn marketing techniques', type: 'telegram', reward: 1.75, url: 'https://t.me/earnpro_marketing', isCompleted: false, isLocked: true, dayOfWeek: 2, order: 2 },
      { id: 'tue-3', title: 'Social Media Marketing', description: 'Leverage social platforms', type: 'video', reward: 3.00, duration: 220, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: true, dayOfWeek: 2, order: 3 },
      { id: 'tue-4', title: 'Global Community', description: 'Connect with worldwide users', type: 'telegram', reward: 1.50, url: 'https://t.me/earnpro_global', isCompleted: false, isLocked: true, dayOfWeek: 2, order: 4 },
      { id: 'tue-5', title: 'Content Creation', description: 'Create engaging content', type: 'video', reward: 2.75, duration: 190, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: true, dayOfWeek: 2, order: 5 },
      { id: 'tue-6', title: 'Creators Hub', description: 'Join content creators group', type: 'telegram', reward: 2.25, url: 'https://t.me/earnpro_creators', isCompleted: false, isLocked: true, dayOfWeek: 2, order: 6 },
      { id: 'tue-7', title: 'Network Building', description: 'Build your professional network', type: 'video', reward: 3.25, duration: 260, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: true, dayOfWeek: 2, order: 7 },
      { id: 'tue-8', title: 'Business Opportunities', description: 'Explore business channels', type: 'telegram', reward: 1.25, url: 'https://t.me/earnpro_business', isCompleted: false, isLocked: true, dayOfWeek: 2, order: 8 },
      { id: 'tue-9', title: 'Analytics & Tracking', description: 'Track your performance', type: 'video', reward: 2.50, duration: 170, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: true, dayOfWeek: 2, order: 9 },
      { id: 'tue-10', title: 'Elite Members', description: 'Join elite performers group', type: 'telegram', reward: 2.75, url: 'https://t.me/earnpro_elite', isCompleted: false, isLocked: true, dayOfWeek: 2, order: 10 },

      // Continue pattern for other days...
      // Wednesday Tasks
      { id: 'wed-1', title: 'Agent Program Deep Dive', description: 'Comprehensive agent training', type: 'video', reward: 4.00, duration: 320, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: false, dayOfWeek: 3, order: 1 },
      { id: 'wed-2', title: 'Agents Community', description: 'Connect with other agents', type: 'telegram', reward: 2.00, url: 'https://t.me/earnpro_agents', isCompleted: false, isLocked: true, dayOfWeek: 3, order: 2 },
      // Add more Wednesday tasks...

      // Thursday Tasks
      { id: 'thu-1', title: 'Global Expansion', description: 'International opportunities', type: 'video', reward: 3.75, duration: 290, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: false, dayOfWeek: 4, order: 1 },
      { id: 'thu-2', title: 'International Hub', description: 'Global community channel', type: 'telegram', reward: 1.75, url: 'https://t.me/earnpro_international', isCompleted: false, isLocked: true, dayOfWeek: 4, order: 2 },
      // Add more Thursday tasks...

      // Friday Tasks
      { id: 'fri-1', title: 'Weekly Review', description: 'Analyze your weekly performance', type: 'video', reward: 3.00, duration: 200, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: false, dayOfWeek: 5, order: 1 },
      { id: 'fri-2', title: 'Weekend Warriors', description: 'Weekend earning strategies', type: 'telegram', reward: 2.50, url: 'https://t.me/earnpro_weekend', isCompleted: false, isLocked: true, dayOfWeek: 5, order: 2 },
      // Add more Friday tasks...

      // Saturday Tasks
      { id: 'sat-1', title: 'Weekend Boost', description: 'Maximize weekend earnings', type: 'video', reward: 3.50, duration: 250, url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: false, dayOfWeek: 6, order: 1 },
      { id: 'sat-2', title: 'Saturday Special', description: 'Weekend exclusive content', type: 'telegram', reward: 2.25, url: 'https://t.me/earnpro_saturday', isCompleted: false, isLocked: true, dayOfWeek: 6, order: 2 },
      // Add more Saturday tasks...

      // Sunday Tasks
      { id: 'sun-1', title: 'Week Preparation', description: 'Prepare for the upcoming week', type: 'video', reward: 2.75, duration: 180, url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4', requiredWatchPercentage: 80, isCompleted: false, isLocked: false, dayOfWeek: 0, order: 1 },
      { id: 'sun-2', title: 'Sunday Motivation', description: 'Motivational content channel', type: 'telegram', reward: 1.50, url: 'https://t.me/earnpro_motivation', isCompleted: false, isLocked: true, dayOfWeek: 0, order: 2 },
      // Add more Sunday tasks...
    ];

    setTasks(weeklyTasks);
  }, []);

  const getDayTasks = (day: number) => {
    return tasks.filter(task => task.dayOfWeek === day).sort((a, b) => a.order - b.order);
  };

  const handleTaskComplete = (taskId: string, earnings: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, isCompleted: true, completedAt: new Date() }
        : task
    ));
    
    // Unlock next task
    const currentTask = tasks.find(t => t.id === taskId);
    if (currentTask) {
      const dayTasks = getDayTasks(currentTask.dayOfWeek);
      const nextTask = dayTasks.find(t => t.order === currentTask.order + 1);
      if (nextTask) {
        setTasks(prev => prev.map(task => 
          task.id === nextTask.id 
            ? { ...task, isLocked: false }
            : task
        ));
      }
    }
    
    setTotalEarnings(prev => prev + earnings);
    setActiveTask(null);
  };

  const currentDayTasks = getDayTasks(selectedDay);
  const todayTasks = getDayTasks(new Date().getDay());
  const completedToday = todayTasks.filter(task => task.isCompleted).length;
  const totalToday = todayTasks.length;

  const bgClass = theme === 'professional' 
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  return (
    <div className={`${bgClass} py-8`}>
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Calendar className={`w-8 h-8 mr-3 ${theme === 'professional' ? 'text-cyan-400' : 'text-green-400'}`} />
            Daily Tasks
          </h1>
          <p className="text-white/70">Complete tasks to earn rewards and boost your earnings</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <DollarSign className={`w-8 h-8 ${theme === 'professional' ? 'text-cyan-300' : 'text-green-300'}`} />
              <span className="text-2xl font-bold text-white">{formatDualCurrencySync(totalEarnings, user?.currency || 'USD')}</span>
            </div>
            <h3 className="text-white font-medium">Task Earnings</h3>
            <p className="text-white/70 text-sm">Total from completed tasks</p>
          </div>

          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className={`w-8 h-8 ${theme === 'professional' ? 'text-green-400' : 'text-blue-300'}`} />
              <span className="text-2xl font-bold text-white">{completedToday}/{totalToday}</span>
            </div>
            <h3 className="text-white font-medium">Today's Progress</h3>
            <p className="text-white/70 text-sm">Tasks completed today</p>
          </div>

          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <Clock className={`w-8 h-8 ${theme === 'professional' ? 'text-blue-400' : 'text-purple-300'}`} />
              <span className="text-2xl font-bold text-white">{tasks.filter(t => t.isCompleted).length}</span>
            </div>
            <h3 className="text-white font-medium">Total Completed</h3>
            <p className="text-white/70 text-sm">All-time task completions</p>
          </div>
        </div>

        {/* Day Navigation */}
        <div className={cardClass}>
          <div className="flex overflow-x-auto">
            {daysOfWeek.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                className={`flex-1 px-6 py-4 whitespace-nowrap transition-all duration-200 ${
                  selectedDay === index
                    ? theme === 'professional'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : index === new Date().getDay()
                    ? theme === 'professional'
                      ? 'text-white bg-gray-700/30'
                      : 'text-white bg-white/5'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">{day}</div>
                  <div className="text-xs opacity-70">
                    {getDayTasks(index).filter(t => t.isCompleted).length}/{getDayTasks(index).length} completed
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        <div className={`${cardClass} p-6 mt-8`}>
          <h3 className="text-xl font-bold text-white mb-6">
            {daysOfWeek[selectedDay]} Tasks
            {selectedDay === new Date().getDay() && (
              <span className={`ml-2 px-2 py-1 ${theme === 'professional' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-green-500/20 text-green-300'} rounded-full text-sm`}>Today</span>
            )}
          </h3>
          
          {currentDayTasks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70">No tasks available for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentDayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 border transition-all duration-200 ${
                    task.isCompleted
                      ? theme === 'professional'
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-green-500/50 bg-green-500/10'
                      : task.isLocked
                      ? theme === 'professional'
                        ? 'border-gray-600/30 opacity-50'
                        : 'border-white/10 opacity-50'
                      : theme === 'professional'
                      ? 'border-gray-600/50 hover:border-gray-500/70'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        task.isCompleted
                          ? theme === 'professional'
                            ? 'bg-cyan-500/20'
                            : 'bg-green-500/20'
                          : task.isLocked
                          ? theme === 'professional'
                            ? 'bg-gray-700/50'
                            : 'bg-white/10'
                          : task.type === 'video'
                          ? theme === 'professional'
                            ? 'bg-blue-500/20'
                            : 'bg-red-500/20'
                          : theme === 'professional'
                          ? 'bg-cyan-500/20'
                          : 'bg-blue-500/20'
                      }`}>
                        {task.isCompleted ? (
                          <CheckCircle className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-300' : 'text-green-300'}`} />
                        ) : task.isLocked ? (
                          <Lock className="w-6 h-6 text-white/50" />
                        ) : task.type === 'video' ? (
                          <Play className={`w-6 h-6 ${theme === 'professional' ? 'text-blue-300' : 'text-red-300'}`} />
                        ) : (
                          <MessageCircle className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-300' : 'text-blue-300'}`} />
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-white font-medium">{task.title}</h4>
                        <p className="text-white/70 text-sm">{task.description}</p>
                        {task.type === 'video' && task.duration && (
                          <p className="text-white/50 text-xs mt-1">
                            Duration: {Math.floor(task.duration / 60)}:{(task.duration % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`${theme === 'professional' ? 'text-cyan-300' : 'text-green-300'} font-bold`}>
                        +{formatDualCurrencySync(task.reward, user?.currency || 'USD')}
                      </div>
                      {!task.isCompleted && !task.isLocked && (
                        <button
                          onClick={() => setActiveTask(task)}
                          className={`mt-2 ${theme === 'professional' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm`}
                        >
                          Start Task
                        </button>
                      )}
                      {task.isLocked && (
                        <p className="text-white/50 text-xs mt-2">Complete previous task</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Modal */}
        {activeTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`${theme === 'professional' ? 'bg-gray-800/90' : 'bg-white/10'} backdrop-blur-lg rounded-2xl p-6 border ${theme === 'professional' ? 'border-gray-700/50' : 'border-white/20'} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{activeTask.title}</h3>
                <button
                  onClick={() => setActiveTask(null)}
                  className="text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              {activeTask.type === 'video' ? (
                <VideoPlayer
                  task={activeTask}
                  onComplete={(earnings) => handleTaskComplete(activeTask.id, earnings)}
                />
              ) : (
                <TelegramTask
                  task={activeTask}
                  onComplete={(earnings) => handleTaskComplete(activeTask.id, earnings)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
