import { supabase } from '../lib/supabase';
import { realtimeService } from './realtimeService';

export class CampaignNotificationService {
  /**
   * Send campaign status update notification to advertiser
   */
  static async notifyCampaignStatusChange(
    campaignId: string, 
    advertiserId: string, 
    oldStatus: string, 
    newStatus: string,
    updatedBy: string
  ) {
    try {
      // Send real-time notification
      await realtimeService.sendNotification(advertiserId, {
        userId: advertiserId,
        title: '📢 Campaign Status Updated',
        message: `Your campaign status changed from ${oldStatus} to ${newStatus}`,
        type: newStatus === 'active' ? 'success' : 'info'
      });

      // Log activity in database
      if (supabase) {
        await supabase.from('campaign_activity_log').insert({
          campaign_id: campaignId,
          action: 'status_change',
          old_value: oldStatus,
          new_value: newStatus,
          updated_by: updatedBy,
          created_at: new Date().toISOString()
        });
      }

      console.log(`✅ Campaign status notification sent to advertiser ${advertiserId}`);
    } catch (error) {
      console.error('Failed to send campaign status notification:', error);
    }
  }

  /**
   * Send campaign performance alert
   */
  static async notifyPerformanceAlert(
    campaignId: string,
    advertiserId: string,
    alertType: 'budget_threshold' | 'completion' | 'low_performance',
    data: any
  ) {
    try {
      const messages = {
        budget_threshold: `🚨 Campaign budget alert: ${data.percentage}% of budget used`,
        completion: `🎉 Campaign completed! Final stats: ${data.stats}`,
        low_performance: `⚠️ Campaign performance below target: ${data.metric}`
      };

      await realtimeService.sendNotification(advertiserId, {
        userId: advertiserId,
        title: 'Campaign Alert',
        message: messages[alertType],
        type: alertType === 'completion' ? 'success' : 'warning'
      });

      console.log(`✅ Performance alert sent to advertiser ${advertiserId}`);
    } catch (error) {
      console.error('Failed to send performance alert:', error);
    }
  }

  /**
   * Send campaign approval notification
   */
  static async notifyCampaignApproval(
    campaignId: string,
    advertiserId: string,
    status: 'approved' | 'rejected',
    feedback?: string
  ) {
    try {
      const isApproved = status === 'approved';
      
      await realtimeService.sendNotification(advertiserId, {
        userId: advertiserId,
        title: isApproved ? '🎉 Campaign Approved!' : '❌ Campaign Needs Review',
        message: isApproved 
          ? 'Your campaign has been approved and is now live!'
          : `Campaign needs changes: ${feedback || 'Please review admin feedback'}`,
        type: isApproved ? 'success' : 'warning'
      });

      console.log(`✅ Campaign approval notification sent to advertiser ${advertiserId}`);
    } catch (error) {
      console.error('Failed to send campaign approval notification:', error);
    }
  }
}

export default CampaignNotificationService;
