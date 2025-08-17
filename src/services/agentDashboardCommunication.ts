/**
 * Agent Dashboard Communication Service
 * Handles real-time communication between admin panel and agent dashboards
 */

import { realtimeService } from './realtimeService';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

export interface AgentNotification {
  id: string;
  agentId: string;
  type: 'tier_update' | 'challenge_start' | 'challenge_complete' | 'challenge_failed' | 'commission_update' | 'status_change';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

export interface AgentDashboardUpdate {
  agentId: string;
  updateType: 'tier' | 'challenge' | 'stats' | 'status';
  data: any;
  timestamp: Date;
}

class AgentDashboardCommunicationService {
  /**
   * Send tier update notification to agent
   */
  static async notifyTierUpdate(agentId: string, oldTier: string, newTier: string, agentName: string) {
    try {
      const notification: AgentNotification = {
        id: crypto.randomUUID(),
        agentId,
        type: 'tier_update',
        title: 'Tier Advancement!',
        message: `Congratulations! You've been promoted from ${oldTier} to ${newTier} tier!`,
        data: { oldTier, newTier, timestamp: new Date() },
        timestamp: new Date(),
        read: false
      };

      // Store notification in database
      await supabase.from('agent_notifications').insert(notification);

      // Send real-time update
      realtimeService.broadcastEvent({
        id: crypto.randomUUID(),
        type: 'user_role_updated',
        data: {
          userId: agentId,
          oldTier,
          newTier,
          agentName,
          notification
        },
        timestamp: new Date()
      });

      console.log(`✅ Tier update notification sent to agent ${agentName}`);
    } catch (error) {
      console.error('Error sending tier update notification:', error);
    }
  }

  /**
   * Send challenge status update to agent
   */
  static async notifyChallengeUpdate(
    agentId: string, 
    challengeType: 'start' | 'progress' | 'complete' | 'failed',
    data: any
  ) {
    try {
      const messages = {
        start: `New ${data.tier} challenge has begun! You have ${data.daysRemaining} days to complete it.`,
        progress: `Challenge progress: ${data.currentReferrals}/${data.targetReferrals} referrals completed.`,
        complete: `🎉 Challenge completed! You've advanced to ${data.newTier} tier!`,
        failed: `Challenge failed. Don't worry, you can try again after the cooldown period.`
      };

      const notification: AgentNotification = {
        id: crypto.randomUUID(),
        agentId,
        type: challengeType === 'complete' ? 'challenge_complete' : 'challenge_start',
        title: challengeType === 'complete' ? 'Challenge Completed!' : 'Challenge Update',
        message: messages[challengeType],
        data,
        timestamp: new Date(),
        read: false
      };

      // Store notification
      await supabase.from('agent_notifications').insert(notification);

      // Send real-time update
      realtimeService.broadcastEvent({
        id: crypto.randomUUID(),
        type: challengeType === 'complete' ? 'achievement_unlocked' : 'notification',
        data: {
          userId: agentId,
          challengeType,
          notification,
          ...data
        },
        timestamp: new Date()
      });

      console.log(`✅ Challenge ${challengeType} notification sent to agent`);
    } catch (error) {
      console.error('Error sending challenge notification:', error);
    }
  }

  /**
   * Send commission update notification
   */
  static async notifyCommissionUpdate(agentId: string, amount: number, type: 'weekly' | 'withdrawal') {
    try {
      const notification: AgentNotification = {
        id: crypto.randomUUID(),
        agentId,
        type: 'commission_update',
        title: 'Commission Earned!',
        message: `You've earned $${amount.toFixed(2)} in ${type} commission!`,
        data: { amount, type, timestamp: new Date() },
        timestamp: new Date(),
        read: false
      };

      await supabase.from('agent_notifications').insert(notification);

      realtimeService.broadcastEvent({
        id: crypto.randomUUID(),
        type: 'earning_update',
        data: {
          userId: agentId,
          amount,
          type,
          notification
        },
        timestamp: new Date()
      });

      console.log(`✅ Commission notification sent to agent`);
    } catch (error) {
      console.error('Error sending commission notification:', error);
    }
  }

  /**
   * Send status change notification (suspend/activate)
   */
  static async notifyStatusChange(agentId: string, status: 'active' | 'suspended' | 'inactive', reason?: string) {
    try {
      const statusMessages = {
        active: 'Your agent account has been activated.',
        suspended: `Your agent account has been suspended. ${reason || 'Please contact support for more information.'}`,
        inactive: 'Your agent account has been deactivated.'
      };

      const notification: AgentNotification = {
        id: crypto.randomUUID(),
        agentId,
        type: 'status_change',
        title: 'Account Status Update',
        message: statusMessages[status],
        data: { status, reason, timestamp: new Date() },
        timestamp: new Date(),
        read: false
      };

      await supabase.from('agent_notifications').insert(notification);

      realtimeService.broadcastEvent({
        id: crypto.randomUUID(),
        type: 'notification',
        data: {
          userId: agentId,
          status,
          reason,
          notification
        },
        timestamp: new Date()
      });

      console.log(`✅ Status change notification sent to agent`);
    } catch (error) {
      console.error('Error sending status change notification:', error);
    }
  }

  /**
   * Send real-time dashboard update
   */
  static async sendDashboardUpdate(update: AgentDashboardUpdate) {
    try {
      realtimeService.broadcastEvent({
        id: crypto.randomUUID(),
        type: 'user_role_updated',
        data: update,
        timestamp: new Date(),
        userId: update.agentId
      });

      console.log(`✅ Dashboard update sent to agent ${update.agentId}`);
    } catch (error) {
      console.error('Error sending dashboard update:', error);
    }
  }

  /**
   * Get all notifications for an agent
   */
  static async getAgentNotifications(agentId: string, limit: number = 20): Promise<AgentNotification[]> {
    try {
      const { data, error } = await supabase
        .from('agent_notifications')
        .select('*')
        .eq('agentId', agentId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching agent notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string) {
    try {
      await supabase
        .from('agent_notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Send bulk notification to multiple agents
   */
  static async sendBulkNotification(
    agentIds: string[], 
    title: string, 
    message: string, 
    type: AgentNotification['type'] = 'notification',
    data?: any
  ) {
    try {
      const notifications = agentIds.map(agentId => ({
        id: crypto.randomUUID(),
        agentId,
        type,
        title,
        message,
        data: data || {},
        timestamp: new Date(),
        read: false
      }));

      // Store all notifications
      await supabase.from('agent_notifications').insert(notifications);

      // Send real-time updates
      for (const notification of notifications) {
        realtimeService.broadcastEvent({
          id: crypto.randomUUID(),
          type: 'notification',
          data: notification,
          timestamp: new Date(),
          userId: notification.agentId
        });
      }

      console.log(`✅ Bulk notification sent to ${agentIds.length} agents`);
    } catch (error) {
      console.error('Error sending bulk notification:', error);
    }
  }

  /**
   * Sync agent data across admin and agent dashboards
   */
  static async syncAgentData(agentId: string) {
    try {
      // Get latest agent profile data
      const { data: profile, error } = await supabase
        .from('agent_profiles')
        .select(`
          *,
          agent_tiers!agent_profiles_current_tier_fkey(*)
        `)
        .eq('user_id', agentId)
        .single();

      if (error) throw error;

      // Send update to agent dashboard
      await this.sendDashboardUpdate({
        agentId,
        updateType: 'stats',
        data: profile,
        timestamp: new Date()
      });

      console.log(`✅ Agent data synced for ${agentId}`);
    } catch (error) {
      console.error('Error syncing agent data:', error);
    }
  }
}

export default AgentDashboardCommunicationService;
