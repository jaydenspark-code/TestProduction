import { supabase } from '../lib/supabase';
import { aiAnalyticsService } from './aiAnalyticsService'; // Assuming you have this service

export type TriggerType = 
  | 'new_referral' 
  | 'payment_received' 
  | 'milestone_reached'
  | 'user_signup'
  | 'task_completed'
  | 'profile_updated';

export type ActionType = 
  | 'send_email' 
  | 'update_status' 
  | 'create_task' 
  | 'award_bonus'
  | 'send_notification'
  | 'update_user_tag';

export interface WorkflowAction {
  type: ActionType;
  params: any; // e.g., { templateId: 'welcome-email' } or { amount: 100, currency: 'USD' }
}

export interface Workflow {
  id: string;
  name: string;
  userId: string;
  trigger: {
    type: TriggerType;
    conditions?: any[];
  };
  actions: WorkflowAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AutomationEngine {
  /**
   * Create and save a new automated workflow
   */
  async createWorkflow(userId: string, name: string, trigger: TriggerType, actions: WorkflowAction[]): Promise<Workflow> {
    try {
      const workflow: Omit<Workflow, 'id'> = {
        name,
        userId,
        trigger: {
          type: trigger,
        },
        actions,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { data, error } = await supabase
        .from('automation_workflows')
        .insert([workflow])
        .select()
        .single();

      if (error) {
        throw new Error('Failed to create workflow');
      }

      return data as Workflow;
    } catch (error) {
      console.error('❌ Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Trigger a workflow based on an event
   */
  async triggerWorkflow(trigger: TriggerType, context: any) {
    const { data: workflows, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('trigger.type', trigger)
      .eq('is_active', true);

    if (error || !workflows) return;

    for (const workflow of workflows) {
      if (this.checkConditions(workflow, context)) {
        await this.executeActions(workflow.actions, context);
      }
    }
  }

  /**
   * Check if conditions are met for a workflow
   */
  private checkConditions(workflow: Workflow, context: any): boolean {
    // Implement condition checking logic here
    // For now, we'll assume all conditions are met
    return true;
  }

  /**
   * Execute the actions of a workflow
   */
  private async executeActions(actions: WorkflowAction[], context: any) {
    for (const action of actions) {
      switch (action.type) {
        case 'send_email':
          // await emailService.send(context.user.email, action.params.templateId, context);
          break;
        case 'award_bonus':
          // await paymentService.awardBonus(context.user.id, action.params.amount);
          break;
        // ... other actions
      }
    }
  }

  /**
   * AI-powered workflow suggestions
   */
  async suggestAutomations(userId: string) {
    try {
      const userBehavior = await this.analyzeUserBehavior(userId);
      const suggestions = await aiAnalyticsService.suggestAutomations(userBehavior);
      
      return suggestions.map(suggestion => ({
        title: suggestion.name,
        description: suggestion.description,
        estimatedTimeSaved: suggestion.timeSavings,
        difficulty: suggestion.complexity,
        trigger: suggestion.trigger,
        actions: suggestion.actions,
      }));
    } catch (error) {
      console.error('❌ Error suggesting automations:', error);
      return [];
    }
  }

  /**
   * Analyze user behavior for AI suggestions
   */
  private async analyzeUserBehavior(userId: string): Promise<any> {
    // In a real application, this would analyze user activity from your database
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('id, type, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10);

    const { data: recentPayments } = await supabase
      .from('transactions')
      .select('id, amount, created_at')
      .eq('user_id', userId)
      .limit(10);

    return {
      recentTasks,
      recentPayments,
      // ... other behavioral data
    };
  }
}

export const automationEngine = new AutomationEngine();
export default automationEngine;
