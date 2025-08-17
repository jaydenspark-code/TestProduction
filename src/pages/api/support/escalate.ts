import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

interface EscalationRequest {
  message: string;
  userId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: 'live_chat' | 'contact_form' | 'email' | 'phone';
  category?: string;
  userEmail?: string;
  userPhone?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, priority, source, category, userEmail, userPhone }: EscalationRequest = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user context if available
    let userContext = null;
    if (userId && supabase) {
      const { data } = await supabase
        .from('users')
        .select('email, full_name, total_earned, is_verified, created_at')
        .eq('id', userId)
        .single();
      
      userContext = data;
    }

    // Determine priority based on message content if not specified
    const urgentKeywords = ['account locked', 'payment failed', 'money missing', 'fraud', 'emergency'];
    const highKeywords = ['can\'t login', 'verification rejected', 'payment stuck', 'urgent'];
    
    let determinedPriority = priority;
    if (!determinedPriority) {
      const lowerMessage = message.toLowerCase();
      if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
        determinedPriority = 'urgent';
      } else if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
        determinedPriority = 'high';
      } else {
        determinedPriority = 'medium';
      }
    }

    // Create support ticket
    const ticketData = {
      user_id: userId,
      message,
      priority: determinedPriority,
      source,
      category: category || 'general',
      status: 'open',
      assigned_agent: null,
      user_email: userEmail || userContext?.email,
      user_phone: userPhone,
      user_context: userContext ? {
        totalEarnings: userContext.total_earned || 0,
        isVerified: userContext.is_verified || false,
        memberSince: userContext.created_at,
        fullName: userContext.full_name
      } : null,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) {
        console.error('Error creating support ticket:', error);
        throw error;
      }

      // Notify available agents based on priority
      await notifyAgents(ticket, determinedPriority);

      res.status(200).json({
        success: true,
        ticketId: ticket.id,
        priority: determinedPriority,
        estimatedResponseTime: getEstimatedResponseTime(determinedPriority),
        message: 'Your request has been escalated to our support team. You will receive a response shortly.'
      });
    } else {
      // Fallback: Send email notification (if email service is configured)
      console.log('Support escalation (no database):', ticketData);
      
      res.status(200).json({
        success: true,
        ticketId: 'TEMP-' + Date.now(),
        priority: determinedPriority,
        estimatedResponseTime: getEstimatedResponseTime(determinedPriority),
        message: 'Your request has been received. Our support team will contact you via email or phone.'
      });
    }

  } catch (error) {
    console.error('Support escalation error:', error);
    res.status(500).json({
      error: 'Failed to escalate support request',
      message: 'Please contact support directly via email or phone.'
    });
  }
}

async function notifyAgents(ticket: any, priority: string) {
  try {
    // In a real implementation, this would:
    // 1. Find available support agents
    // 2. Send notifications via email, SMS, or internal messaging
    // 3. Update agent workload
    // 4. Set up automatic escalation timers
    
    console.log(`Notifying agents about ${priority} priority ticket:`, ticket.id);
    
    // For now, we'll just log the notification
    // In production, integrate with your notification system:
    // - Email service (SendGrid, SES, etc.)
    // - SMS service (Twilio, etc.)
    // - Internal messaging system
    // - Push notifications for mobile agents
    
    if (supabase) {
      // Create notification for agents
      await supabase
        .from('agent_notifications')
        .insert({
          ticket_id: ticket.id,
          priority,
          message: `New ${priority} priority support request: ${ticket.message.substring(0, 100)}...`,
          notification_type: 'support_escalation',
          created_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error notifying agents:', error);
  }
}

function getEstimatedResponseTime(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'Within 15 minutes';
    case 'high':
      return 'Within 1 hour';
    case 'medium':
      return 'Within 4 hours';
    case 'low':
      return 'Within 24 hours';
    default:
      return 'Within 4 hours';
  }
}
