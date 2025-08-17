import { supabase } from "../lib/supabase";
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface LiveEvent {
  id: string;
  type: 'new_referral' | 'earning_update' | 'withdrawal_processed' | 'user_joined' | 'achievement_unlocked' | 'notification' | 'user_role_updated';
  data: any;
  timestamp: Date;
  userId?: string;
}

export interface RealtimeStats {
  activeUsers: number;
  totalEarnings: number;
  newReferrals: number;
  recentTransactions: any[];
}

export interface NotificationEvent {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

type EventCallback = (event: LiveEvent) => void;
type StatsCallback = (stats: RealtimeStats) => void;
type NotificationCallback = (notification: NotificationEvent) => void;

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private eventCallbacks: Map<string, EventCallback[]> = new Map();
  private statsCallbacks: StatsCallback[] = [];
  private notificationCallbacks: NotificationCallback[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentUserId: string | null = null;

  constructor() {
    this.initializeRealtimeConnections();
    this.setupConnectionMonitoring();
  }

  /**
   * Initialize real-time connections
   */
  private async initializeRealtimeConnections() {
    try {
      console.log('🔄 Initializing real-time connections...');
      
      // Set up global events channel
      await this.setupGlobalEventsChannel();
      
      // Set up stats monitoring
      await this.setupStatsChannel();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('✅ Real-time service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize real-time service:', error);
      this.handleConnectionError();
    }
  }

  /**
   * Set up global events channel for platform-wide updates
   */
  private async setupGlobalEventsChannel() {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Skipping real-time channels setup');
      return;
    }
    
    const channel = supabase
      .channel('global-events')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'transactions' 
        }, 
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleTransactionUpdate(payload);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'referrals' 
        }, 
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleReferralUpdate(payload);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'users' 
        }, 
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleUserUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('Global events channel status:', status);
      });

    this.channels.set('global-events', channel);
  }

  /**
   * Set up stats monitoring channel
   */
  private async setupStatsChannel() {
    // Real-time stats updates
    setInterval(async () => {
      const stats = await this.fetchLatestStats();
      this.broadcastStats(stats);
    }, 5000); // Update every 5 seconds
  }

  /**
   * Subscribe to user-specific events
   */
  subscribeToUserEvents(userId: string): void {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Skipping user events subscription');
      return;
    }
    
    if (this.currentUserId === userId) return;
    
    this.currentUserId = userId;
    
    // Unsubscribe from previous user events
    if (this.channels.has('user-events')) {
      this.channels.get('user-events')?.unsubscribe();
    }

    const channel = supabase
      .channel(`user-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        }, 
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleUserTransactionUpdate(payload, userId);
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleNotificationUpdate(payload, userId);
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'referrals',
          filter: `referrer_id=eq.${userId}`
        }, 
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleUserReferralUpdate(payload, userId);
        }
      )
      .subscribe((status) => {
        console.log(`User ${userId} events channel status:`, status);
      });

    this.channels.set('user-events', channel);
    console.log(`✅ Subscribed to events for user: ${userId}`);
  }

  /**
   * Subscribe to live event updates
   */
  onLiveEvent(eventType: string, callback: EventCallback): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }
    
    this.eventCallbacks.get(eventType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.eventCallbacks.get(eventType) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to real-time stats updates
   */
  onStatsUpdate(callback: StatsCallback): () => void {
    this.statsCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statsCallbacks.indexOf(callback);
      if (index > -1) {
        this.statsCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to notification updates
   */
  onNotification(callback: NotificationCallback): () => void {
    this.notificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Send real-time notification to user
   */
  async sendNotification(userId: string, notification: Omit<NotificationEvent, 'id' | 'timestamp' | 'read'>): Promise<void> {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Skipping notification send');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            is_read: false,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      
      console.log(`✅ Notification sent to user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
    }
  }

  /**
   * Broadcast live event to global audience
   */
  async broadcastEvent(event: Omit<LiveEvent, 'id' | 'timestamp'>): Promise<void> {
    const liveEvent: LiveEvent = {
      id: Math.random().toString(36).substr(2, 9),
      ...event,
      timestamp: new Date()
    };

    // Broadcast to relevant subscribers
    const callbacks = this.eventCallbacks.get(event.type) || [];
    callbacks.forEach(callback => {
      try {
        callback(liveEvent);
      } catch (error) {
        console.error('Event callback error:', error);
      }
    });

    // Store in database for persistence
    try {
      await this.storeEvent(liveEvent);
    } catch (error) {
      console.error('Failed to store event:', error);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { 
    connected: boolean; 
    activeChannels: number; 
    reconnectAttempts: number; 
  } {
    return {
      connected: this.isConnected,
      activeChannels: this.channels.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Manually trigger reconnection
   */
  async reconnect(): Promise<void> {
    console.log('🔄 Manually triggering reconnection...');
    await this.cleanup();
    await this.initializeRealtimeConnections();
  }

  /**
   * Get live platform statistics
   */
  async getLiveStats(): Promise<RealtimeStats> {
    return await this.fetchLatestStats();
  }

  /**
   * Event handlers
   */
  private handleTransactionUpdate(payload: RealtimePostgresChangesPayload<any>) {
    const transaction = payload.new;
    
    this.broadcastEvent({
      type: 'earning_update',
      data: {
        userId: transaction.user_id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description
      },
      userId: transaction.user_id
    });

    // Update live stats
    this.updateLiveStats();
  }

  private handleReferralUpdate(payload: RealtimePostgresChangesPayload<any>) {
    const referral = payload.new;
    
    this.broadcastEvent({
      type: 'new_referral',
      data: {
        referrerId: referral.referrer_id,
        referredId: referral.referred_id,
        status: referral.status
      },
      userId: referral.referrer_id
    });

    // Send notification to referrer
    if (referral.status === 'completed') {
      this.sendNotification(referral.referrer_id, {
        userId: referral.referrer_id,
        title: '🎉 New Referral!',
        message: 'Congratulations! Your referral has been activated.',
        type: 'success'
      });
    }
  }

  private handleUserUpdate(payload: RealtimePostgresChangesPayload<any>) {
    const user = payload.new;
    const oldUser = payload.old;
    
    // Check for role changes or achievements
    if (user.role !== oldUser?.role && user.role === 'agent') {
      this.broadcastEvent({
        type: 'achievement_unlocked',
        data: {
          userId: user.id,
          achievement: 'Agent Status',
          description: 'Became an EarnPro Agent'
        },
        userId: user.id
      });
    }

    // Check for payment status changes
    if (user.is_paid !== oldUser?.is_paid && user.is_paid) {
      this.broadcastEvent({
        type: 'user_joined',
        data: {
          userId: user.id,
          fullName: user.full_name,
          country: user.country
        }
      });
    }
  }

  private handleUserTransactionUpdate(payload: RealtimePostgresChangesPayload<any>, userId: string) {
    const transaction = payload.new;
    
    // Send real-time notification for earnings
    if (transaction.type === 'earning' || transaction.type === 'referral') {
      this.sendNotification(userId, {
        userId,
        title: '💰 New Earnings!',
        message: `You earned $${transaction.amount} from ${transaction.description}`,
        type: 'success'
      });
    }
  }

  private handleUserReferralUpdate(payload: RealtimePostgresChangesPayload<any>, userId: string) {
    const referral = payload.new;
    
    if (referral.status === 'completed') {
      this.sendNotification(userId, {
        userId,
        title: '🎯 Referral Success!',
        message: 'Your referral has successfully activated their account!',
        type: 'success'
      });
    }
  }

  private handleNotificationUpdate(payload: RealtimePostgresChangesPayload<any>, userId: string) {
    if (payload.eventType === 'INSERT') {
      const notification: NotificationEvent = {
        id: payload.new.id,
        userId: payload.new.user_id,
        title: payload.new.title,
        message: payload.new.message,
        type: payload.new.type,
        timestamp: new Date(payload.new.created_at),
        read: payload.new.is_read
      };

      // Broadcast to notification subscribers
      this.notificationCallbacks.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Notification callback error:', error);
        }
      });
    }
  }

  /**
   * Utility methods
   */
  private async fetchLatestStats(): Promise<RealtimeStats> {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Returning mock stats');
      return {
        activeUsers: 1250,
        totalEarnings: 12500.75,
        newReferrals: 42,
        recentTransactions: []
      };
    }
    
    try {
      // Fetch active users (simplified - count all verified users since last_login column doesn't exist)
      const { data: activeUsersData } = await supabase
        .from('users')
        .select('id')
        .eq('is_verified', true);

      // Fetch total earnings
      const { data: earningsData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'earning');

      // Fetch recent referrals (today's referrals)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .gte('created_at', today.toISOString());

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        activeUsers: activeUsersData?.length || 0,
        totalEarnings: earningsData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        newReferrals: referralsData?.length || 0,
        recentTransactions: transactionsData || []
      };
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return {
        activeUsers: 0,
        totalEarnings: 0,
        newReferrals: 0,
        recentTransactions: []
      };
    }
  }

  private broadcastStats(stats: RealtimeStats) {
    this.statsCallbacks.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        console.error('Stats callback error:', error);
      }
    });
  }

  private async updateLiveStats() {
    const stats = await this.fetchLatestStats();
    this.broadcastStats(stats);
  }

  private async storeEvent(event: LiveEvent): Promise<void> {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Skipping event storage');
      return;
    }
    
    // Store events in a separate table for analytics
    const { error } = await supabase
      .from('live_events')
      .insert([
        {
          event_type: event.type,
          data: event.data,
          user_id: event.userId,
          created_at: event.timestamp.toISOString()
        }
      ]);

    if (error) {
      console.error('Failed to store event:', error);
    }
  }

  private setupConnectionMonitoring() {
    // Monitor connection status
    setInterval(() => {
      if (!this.isConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.handleConnectionError();
      }
    }, 30000); // Check every 30 seconds
  }

  private handleConnectionError() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      try {
        await this.initializeRealtimeConnections();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private async cleanup(): Promise<void> {
    // Unsubscribe from all channels
    for (const [name, channel] of this.channels) {
      await channel.unsubscribe();
      console.log(`Unsubscribed from ${name}`);
    }
    
    this.channels.clear();
    this.isConnected = false;
  }

  /**
   * Cleanup when service is destroyed
   */
  async destroy(): Promise<void> {
    await this.cleanup();
    this.eventCallbacks.clear();
    this.statsCallbacks.length = 0;
    this.notificationCallbacks.length = 0;
    console.log('✅ Realtime service destroyed');
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
