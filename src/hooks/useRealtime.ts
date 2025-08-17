import { useState, useEffect, useCallback, useRef } from 'react';
import realtimeService, { 
  LiveEvent, 
  RealtimeStats, 
  NotificationEvent 
} from '../services/realtimeService';
import { useAuth } from '../context/AuthContext';

export interface UseRealtimeOptions {
  enableStats?: boolean;
  enableNotifications?: boolean;
  enableEvents?: boolean;
  eventTypes?: string[];
}

export interface RealtimeState {
  stats: RealtimeStats | null;
  events: LiveEvent[];
  notifications: NotificationEvent[];
  connectionStatus: {
    connected: boolean;
    activeChannels: number;
    reconnectAttempts: number;
  };
  loading: boolean;
  error: string | null;
}

export const useRealtime = (options: UseRealtimeOptions = {}) => {
  const { user } = useAuth();
  const {
    enableStats = true,
    enableNotifications = true,
    enableEvents = true,
    eventTypes = ['new_referral', 'earning_update', 'user_joined', 'achievement_unlocked']
  } = options;

  const [state, setState] = useState<RealtimeState>({
    stats: null,
    events: [],
    notifications: [],
    connectionStatus: {
      connected: false,
      activeChannels: 0,
      reconnectAttempts: 0
    },
    loading: true,
    error: null
  });

  const unsubscribeFunctions = useRef<(() => void)[]>([]);

  // Update stats
  const handleStatsUpdate = useCallback((stats: RealtimeStats) => {
    setState(prev => ({
      ...prev,
      stats,
      loading: false
    }));
  }, []);

  // Handle live events
  const handleLiveEvent = useCallback((event: LiveEvent) => {
    setState(prev => ({
      ...prev,
      events: [event, ...prev.events.slice(0, 49)] // Keep last 50 events
    }));
  }, []);

  // Handle notifications
  const handleNotification = useCallback((notification: NotificationEvent) => {
    setState(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications.slice(0, 19)] // Keep last 20 notifications
    }));
  }, []);

  // Update connection status
  const updateConnectionStatus = useCallback(() => {
    const status = realtimeService.getConnectionStatus();
    setState(prev => ({
      ...prev,
      connectionStatus: status
    }));
  }, []);

  // Initialize subscriptions
  useEffect(() => {
    const initializeSubscriptions = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Subscribe to user-specific events if user is available
        if (user?.id) {
          realtimeService.subscribeToUserEvents(user.id);
        }

        // Subscribe to stats updates
        if (enableStats) {
          const unsubscribeStats = realtimeService.onStatsUpdate(handleStatsUpdate);
          unsubscribeFunctions.current.push(unsubscribeStats);

          // Get initial stats
          const initialStats = await realtimeService.getLiveStats();
          handleStatsUpdate(initialStats);
        }

        // Subscribe to notifications
        if (enableNotifications) {
          const unsubscribeNotifications = realtimeService.onNotification(handleNotification);
          unsubscribeFunctions.current.push(unsubscribeNotifications);
        }

        // Subscribe to live events
        if (enableEvents) {
          eventTypes.forEach(eventType => {
            const unsubscribeEvent = realtimeService.onLiveEvent(eventType, handleLiveEvent);
            unsubscribeFunctions.current.push(unsubscribeEvent);
          });
        }

        // Update connection status
        updateConnectionStatus();
        
        // Set up periodic connection status updates
        const statusInterval = setInterval(updateConnectionStatus, 5000);
        unsubscribeFunctions.current.push(() => clearInterval(statusInterval));

        setState(prev => ({ ...prev, loading: false }));
      } catch (error: any) {
        console.error('Failed to initialize realtime subscriptions:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to initialize real-time updates'
        }));
      }
    };

    initializeSubscriptions();

    // Cleanup function
    return () => {
      unsubscribeFunctions.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      });
      unsubscribeFunctions.current = [];
    };
  }, [
    user?.id, 
    enableStats, 
    enableNotifications, 
    enableEvents, 
    eventTypes.join(','), // Dependency on event types
    handleStatsUpdate,
    handleLiveEvent,
    handleNotification,
    updateConnectionStatus
  ]);

  // Send notification function
  const sendNotification = useCallback(async (
    userId: string, 
    notification: Omit<NotificationEvent, 'id' | 'timestamp' | 'read'>
  ) => {
    try {
      await realtimeService.sendNotification(userId, notification);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, []);

  // Broadcast event function
  const broadcastEvent = useCallback(async (
    event: Omit<LiveEvent, 'id' | 'timestamp'>
  ) => {
    try {
      await realtimeService.broadcastEvent(event);
    } catch (error) {
      console.error('Failed to broadcast event:', error);
    }
  }, []);

  // Reconnect function
  const reconnect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await realtimeService.reconnect();
      updateConnectionStatus();
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      console.error('Reconnection failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Reconnection failed'
      }));
    }
  }, [updateConnectionStatus]);

  // Clear events function
  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, events: [] }));
  }, []);

  // Clear notifications function
  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    }));
  }, []);

  return {
    ...state,
    actions: {
      sendNotification,
      broadcastEvent,
      reconnect,
      clearEvents,
      clearNotifications,
      markNotificationAsRead
    }
  };
};

// Specialized hooks for specific use cases

export const useRealtimeStats = () => {
  return useRealtime({
    enableStats: true,
    enableNotifications: false,
    enableEvents: false
  });
};

export const useRealtimeNotifications = () => {
  return useRealtime({
    enableStats: false,
    enableNotifications: true,
    enableEvents: false
  });
};

export const useRealtimeEvents = (eventTypes?: string[]) => {
  return useRealtime({
    enableStats: false,
    enableNotifications: false,
    enableEvents: true,
    eventTypes
  });
};

export const useUserRealtime = () => {
  return useRealtime({
    enableStats: true,
    enableNotifications: true,
    enableEvents: true,
    eventTypes: ['earning_update', 'new_referral', 'achievement_unlocked']
  });
};
