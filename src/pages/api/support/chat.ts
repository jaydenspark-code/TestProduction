import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

interface ChatRequest {
  message: string;
  userId?: string;
  context: 'support' | 'general';
  previousMessages?: Array<{
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
  }>;
}

interface ChatResponse {
  response: string;
  suggestions: string[];
  confidence: number;
  source: 'knowledge_base' | 'ai' | 'escalation';
  requiresHuman?: boolean;
}

class EnhancedEarnProChatbot {
  private geminiApiKey: string;
  
  // Enhanced knowledge base with context-aware responses
  private knowledgeBase = {
    'referral_system': {
      keywords: ['referral', 'refer', 'link', 'share', 'invite', 'commission', 'multi-level', 'levels'],
      contextualResponses: {
        beginner: 'Welcome to EarnPro! Our referral system is simple: share your unique link and earn from 3 levels of referrals. You get commissions when people you invite (Level 1), their invites (Level 2), and their invites (Level 3) earn money. Start by sharing your link with friends and family!',
        intermediate: 'Great question! Your referral earnings come from 3 levels: Direct referrals give you the highest commission, then their referrals give you a smaller percentage, and finally their referrals give you an even smaller percentage. The key is building a network of active users.',
        advanced: 'For advanced referral strategies: Focus on quality over quantity, engage with your network regularly, provide value to your referrals by helping them succeed, and consider applying for the Agent Program for higher commission rates and exclusive tools.',
        default: 'EarnPro\'s multi-level referral system lets you earn from 3 levels of referrals. Share your unique link and earn commissions when your network is active. The more people you help succeed, the more you earn!'
      },
      suggestions: ['How much per referral?', 'Multi-level explained', 'Best sharing strategies', 'Track my referrals']
    },
    'agent_program': {
      keywords: ['agent', 'influencer', 'program', 'milestone', 'weekly', 'commission', 'apply'],
      contextualResponses: {
        eligible: 'Based on your activity, you might be eligible for our Agent Program! Agents get 5-20% progressive weekly commissions, milestone bonuses, priority withdrawals, and exclusive marketing tools. Minimum social media following required.',
        not_eligible: 'The Agent Program is for content creators with established social media presence. Requirements include minimum followers on platforms like Instagram, TikTok, or YouTube. Focus on building your following and earnings first!',
        default: 'Our Agent Program offers enhanced earning opportunities for influencers and content creators. Benefits include progressive weekly commissions (5-20%), milestone bonuses, faster withdrawals, and exclusive promotional tools.'
      },
      suggestions: ['Agent requirements', 'Commission structure', 'Application process', 'Benefits overview']
    },
    'daily_tasks': {
      keywords: ['task', 'daily', 'video', 'telegram', 'watch', 'complete', 'unlock'],
      contextualResponses: {
        new_user: 'Daily tasks are a great way to start earning! Complete video watching tasks (watch at least 80% of the video), join Telegram channels, and engage with social media content. Tasks unlock progressively - complete one to access the next.',
        regular_user: 'Keep up with your daily tasks! They reset every 24 hours and provide consistent earning opportunities. Pro tip: Set a daily routine to maximize your task completion and earnings.',
        default: 'Daily tasks boost your earnings significantly! Complete video watching (80% minimum), join Telegram channels, and social media engagement tasks. New tasks unlock as you complete previous ones.'
      },
      suggestions: ['Video completion tips', 'Telegram verification', 'Task schedule', 'Unlock requirements']
    },
    'payments_withdrawal': {
      keywords: ['payment', 'withdraw', 'payout', 'money', 'earnings', 'method', 'time'],
      contextualResponses: {
        first_withdrawal: 'Congratulations on reaching withdrawal threshold! We process all payments within 24 hours via PayPal, bank transfer, or cryptocurrency. Choose your preferred method in the withdrawal section.',
        regular_user: 'Your payments are processed daily within 24 hours. We support multiple payment methods for your convenience. Agent members get priority processing and increased withdrawal frequency.',
        high_earner: 'As a high-value user, you have access to priority payment processing and additional withdrawal options. Consider upgrading to Agent status for even faster processing and higher limits.',
        default: 'All payments are processed daily within 24 hours through secure, verified payment partners. We support PayPal, bank transfers, and cryptocurrency. Minimum withdrawal amounts vary by country and payment method.'
      },
      suggestions: ['Payment methods', 'Processing time', 'Withdrawal limits', 'Agent benefits']
    },
    'account_issues': {
      keywords: ['account', 'login', 'password', 'verification', 'locked', 'suspended', 'access'],
      contextualResponses: {
        default: 'Account issues require immediate attention. For login problems, try resetting your password. For verification issues, ensure all documents are clear and valid. For account restrictions, contact support immediately.'
      },
      suggestions: ['Reset password', 'Verify account', 'Contact support', 'Account security'],
      requiresHuman: true
    },
    'technical_support': {
      keywords: ['bug', 'error', 'not working', 'problem', 'issue', 'broken', 'crash'],
      contextualResponses: {
        default: 'Technical issues can be frustrating! Try refreshing the page, clearing your browser cache, or using a different browser. If the problem persists, our technical team needs to investigate this for you.'
      },
      suggestions: ['Clear cache', 'Try different browser', 'Contact tech support', 'Report bug'],
      requiresHuman: true
    }
  };

  // Topics requiring human support
  private humanEscalationKeywords = [
    'account locked', 'payment failed', 'money missing', 'fraud', 'scam',
    'legal issue', 'complaint', 'refund', 'dispute', 'urgent', 'emergency',
    'can\'t login', 'account suspended', 'verification rejected', 'payment stuck'
  ];

  constructor() {
    this.geminiApiKey = process.env.VITE_GEMINI_API_KEY || '';
  }

  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Get user context for personalized responses
      const userContext = await this.getUserContext(request.userId);
      
      // Check if requires immediate human escalation
      if (this.requiresHumanSupport(request.message)) {
        return {
          response: "I understand this is important to you. Let me connect you with a human support agent who can provide personalized assistance with this matter. They'll be with you shortly.",
          suggestions: ['Wait for agent', 'Describe issue', 'Provide details', 'Contact info'],
          confidence: 1.0,
          source: 'escalation',
          requiresHuman: true
        };
      }

      // Try knowledge base first
      const knowledgeResponse = this.getKnowledgeBaseResponse(request.message, userContext);
      if (knowledgeResponse) {
        return knowledgeResponse;
      }

      // Use AI for complex queries
      if (this.geminiApiKey) {
        const aiResponse = await this.getAIResponse(request.message, userContext, request.previousMessages);
        if (aiResponse) {
          return aiResponse;
        }
      }

      // Fallback response
      return {
        response: "I want to make sure I give you the most accurate information. Could you provide more details about what you're looking for? I can help with referrals, tasks, payments, account issues, and general platform questions.",
        suggestions: ['Referral help', 'Task assistance', 'Payment questions', 'Account support'],
        confidence: 0.3,
        source: 'knowledge_base'
      };

    } catch (error) {
      console.error('Chat processing error:', error);
      return {
        response: "I'm experiencing some technical difficulties right now. Please try again in a moment, or contact our support team directly for immediate assistance.",
        suggestions: ['Try again', 'Contact support', 'Email support', 'Call support'],
        confidence: 0.1,
        source: 'knowledge_base'
      };
    }
  }

  private requiresHumanSupport(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.humanEscalationKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
  }

  private async getUserContext(userId?: string) {
    if (!userId || !supabase) {
      return { segment: 'anonymous', totalEarnings: 0, isVerified: false, isPaid: false };
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('total_earned, is_verified, is_paid, created_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const totalEarnings = data.total_earned || 0;
      const accountAge = Date.now() - new Date(data.created_at).getTime();
      const daysSinceSignup = Math.floor(accountAge / (1000 * 60 * 60 * 24));

      return {
        segment: this.determineUserSegment(totalEarnings, daysSinceSignup),
        totalEarnings,
        isVerified: data.is_verified || false,
        isPaid: data.is_paid || false,
        daysSinceSignup
      };
    } catch (error) {
      console.error('Error fetching user context:', error);
      return { segment: 'unknown', totalEarnings: 0, isVerified: false, isPaid: false };
    }
  }

  private determineUserSegment(totalEarnings: number, daysSinceSignup: number): string {
    if (daysSinceSignup < 7) return 'new_user';
    if (totalEarnings === 0) return 'inactive';
    if (totalEarnings < 50) return 'beginner';
    if (totalEarnings < 500) return 'intermediate';
    if (totalEarnings < 2000) return 'advanced';
    return 'high_earner';
  }

  private getKnowledgeBaseResponse(message: string, userContext: any): ChatResponse | null {
    const lowerMessage = message.toLowerCase();
    
    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        const response = data.contextualResponses[userContext.segment] || 
                        data.contextualResponses.default;
        
        return {
          response,
          suggestions: data.suggestions,
          confidence: 0.9,
          source: 'knowledge_base',
          requiresHuman: data.requiresHuman || false
        };
      }
    }
    
    return null;
  }

  private async getAIResponse(message: string, userContext: any, previousMessages?: any[]): Promise<ChatResponse | null> {
    if (!this.geminiApiKey) return null;

    try {
      const contextPrompt = `You are EarnPro's intelligent support assistant. 
      
      CONTEXT:
      - User segment: ${userContext.segment}
      - Total earnings: $${userContext.totalEarnings}
      - Account verified: ${userContext.isVerified}
      - Days since signup: ${userContext.daysSinceSignup}
      
      RULES:
      1. Only answer EarnPro-related questions
      2. Be helpful, professional, and encouraging
      3. Provide specific, actionable advice
      4. Consider user's experience level
      5. If unsure, recommend contacting support
      
      PREVIOUS CONTEXT: ${previousMessages ? previousMessages.slice(-2).map(m => `${m.isUser ? 'User' : 'Assistant'}: ${m.content}`).join('\n') : 'No previous context'}
      
      USER QUESTION: ${message}
      
      Provide a helpful response (max 150 words) and suggest 3-4 relevant follow-up questions.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: contextPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          }
        })
      });

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiResponse) {
        // Extract suggestions from AI response or generate contextually
        const suggestions = this.generateSmartSuggestions(message, userContext);
        
        return {
          response: aiResponse,
          suggestions,
          confidence: 0.8,
          source: 'ai'
        };
      }
    } catch (error) {
      console.error('AI response error:', error);
    }
    
    return null;
  }

  private generateSmartSuggestions(message: string, userContext: any): string[] {
    const lowerMessage = message.toLowerCase();
    
    // Context-aware suggestions based on user segment
    if (userContext.segment === 'new_user') {
      return ['Getting started guide', 'First withdrawal', 'Referral basics', 'Daily tasks'];
    }
    
    if (userContext.segment === 'beginner') {
      return ['Boost earnings', 'Share referral link', 'Complete tasks', 'Verification help'];
    }
    
    if (lowerMessage.includes('earn') || lowerMessage.includes('money')) {
      return userContext.totalEarnings < 100 ? 
        ['Daily task tips', 'Referral strategies', 'Task completion', 'Earning methods'] :
        ['Agent program', 'Advanced strategies', 'Optimize earnings', 'Milestone bonuses'];
    }
    
    if (lowerMessage.includes('referral')) {
      return ['Share techniques', 'Multi-level system', 'Track referrals', 'Referral tools'];
    }
    
    return ['Help center', 'Contact support', 'Platform guide', 'Account settings'];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chatbot = new EnhancedEarnProChatbot();
    const result = await chatbot.processMessage(req.body);
    
    // Log conversation for analytics (anonymized)
    if (req.body.userId && supabase) {
      await supabase
        .from('support_conversations')
        .insert({
          user_id: req.body.userId,
          message: req.body.message,
          response: result.response,
          confidence: result.confidence,
          source: result.source,
          requires_human: result.requiresHuman || false
        });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Support chat API error:', error);
    res.status(500).json({
      response: 'I apologize, but I\'m experiencing technical difficulties. Please contact our support team directly.',
      suggestions: ['Contact support', 'Try again later', 'Email support', 'Call support'],
      confidence: 0.1,
      source: 'knowledge_base'
    });
  }
}
