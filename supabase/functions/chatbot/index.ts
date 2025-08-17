import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface UserContext {
  userId: string
  totalEarnings: number
  referralCount: number
  isVerified: boolean
  isPaid: boolean
  segment: string
  aiInsights?: any
}

class SmartEarnProChatbot {
  private geminiApiKey: string
  private supabase: any
  
  // Comprehensive EarnPro Knowledge Base
  private knowledgeBase = {
    'referral_system': {
      keywords: ['referral', 'refer', 'link', 'share', 'invite', 'commission', 'multi-level'],
      response: 'EarnPro\'s referral system offers multi-level earnings: Direct referrals (Level 1), their referrals (Level 2), and their referrals (Level 3). You earn commissions from all three levels. Share your unique link or QR code to start earning!',
      suggestions: ['How much per referral?', 'Multi-level explained', 'Share referral link', 'Track referrals']
    },
    'agent_program': {
      keywords: ['agent', 'influencer', 'program', 'milestone', 'weekly commission'],
      response: 'The Agent Program is for content creators with social media following. Benefits: Progressive weekly commissions (5-20%), milestone bonuses, increased withdrawal frequency, and exclusive tools. Minimum follower requirements apply.',
      suggestions: ['Agent requirements', 'Commission rates', 'Apply for agent', 'Milestone bonuses']
    },
    'daily_tasks': {
      keywords: ['task', 'daily', 'video', 'telegram', 'watch', 'complete'],
      response: 'Daily tasks boost your earnings! Complete video watching (80% minimum), join Telegram channels, and social media tasks. Tasks unlock progressively - complete one to access the next. Reset daily for fresh opportunities.',
      suggestions: ['Video task tips', 'Telegram verification', 'Task schedule', 'Completion requirements']
    },
    'payments_withdrawal': {
      keywords: ['payment', 'withdraw', 'payout', 'money', 'earnings', 'frequency'],
      response: 'All users receive daily payouts processed within 24 hours. Multiple payment methods supported including PayPal, bank transfer, and cryptocurrency. Minimum withdrawal varies by country and payment method. All payments processed securely.'
      suggestions: ['Payment methods', 'Withdrawal limits', 'Processing time', 'Agent benefits']
    },
    'registration_activation': {
      keywords: ['register', 'signup', 'account', 'verify', 'activation', 'fee'],
      response: 'Join EarnPro in 4 steps: 1) Register with email, 2) Verify email address, 3) Complete activation payment (varies by country), 4) Start earning immediately! Activation fee is one-time and shown in local currency.',
      suggestions: ['Activation cost', 'Email verification', 'Payment methods', 'Account setup']
    },
    'security_privacy': {
      keywords: ['security', 'safe', 'privacy', 'data', 'protection', 'secure'],
      response: 'EarnPro uses bank-level security: SSL encryption, secure payment processing, data protection compliance, and regular security audits. Your personal and financial data is fully protected.',
      suggestions: ['Data protection', 'Payment security', 'Account safety', 'Privacy policy']
    },
    'support_contact': {
      keywords: ['help', 'support', 'contact', 'problem', 'issue', 'assistance'],
      response: 'Get help 24/7: Live chat (fastest), email support@earnpro.com, or phone support. Response times: Live chat (immediate), email (24 hours), urgent issues (priority handling).',
      suggestions: ['Live chat', 'Email support', 'Phone support', 'FAQ section']
    },
    'earnings_optimization': {
      keywords: ['earn more', 'increase', 'optimize', 'boost', 'maximize'],
      response: 'Maximize earnings: Complete daily tasks, share referral links actively, engage on social media, join the Agent Program if eligible, and participate in special campaigns. Consistency is key!',
      suggestions: ['Daily strategies', 'Social media tips', 'Agent program', 'Special campaigns']
    }
  }

  // Topics that should NOT be answered
  private restrictedTopics = [
    'personal data', 'user passwords', 'financial details', 'admin access',
    'database information', 'api keys', 'internal systems', 'other platforms',
    'competitors', 'investment advice', 'legal advice', 'medical advice'
  ]

  constructor() {
    this.geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY') || ''
    this.supabase = createClient(
      Deno.env.get('VITE_SUPABASE_URL') || '',
      Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY') || ''
    )
  }

  async processMessage(message: string, userContext: UserContext): Promise<{
    response: string
    suggestions: string[]
    source: 'local' | 'gemini'
  }> {
    // 1. Security Check - Block restricted topics
    if (this.isRestrictedTopic(message)) {
      return {
        response: "I'm designed to help with EarnPro-related questions only. For account-specific or sensitive information, please contact our support team directly.",
        suggestions: ['Contact support', 'FAQ section', 'Account help', 'General questions'],
        source: 'local'
      }
    }

    // 2. Try Local Knowledge Base First
    const localResponse = this.getLocalResponse(message, userContext)
    if (localResponse) {
      return { ...localResponse, source: 'local' }
    }

    // 3. Check if question is EarnPro-related
    if (!this.isEarnProRelated(message)) {
      return {
        response: "I specialize in EarnPro-related questions only. I can help with referrals, tasks, payments, agent program, and platform features. How can I assist you with EarnPro today?",
        suggestions: ['Referral system', 'Daily tasks', 'Payment info', 'Agent program'],
        source: 'local'
      }
    }

    // 4. Use Gemini for Complex EarnPro Questions
    if (this.geminiApiKey) {
      try {
        const geminiResponse = await this.getGeminiResponse(message, userContext)
        return { ...geminiResponse, source: 'gemini' }
      } catch (error) {
        console.error('Gemini API error:', error)
      }
    }

    // 5. Fallback Response
    return {
      response: "I understand you're asking about EarnPro, but I need more specific information to help you properly. Could you rephrase your question or contact our support team for detailed assistance?",
      suggestions: ['Contact support', 'Referral help', 'Task assistance', 'Payment questions'],
      source: 'local'
    }
  }

  private isRestrictedTopic(message: string): boolean {
    const lowerMessage = message.toLowerCase()
    return this.restrictedTopics.some(topic => lowerMessage.includes(topic))
  }

  private isEarnProRelated(message: string): boolean {
    const earnProKeywords = [
      'earnpro', 'referral', 'task', 'payment', 'agent', 'commission',
      'withdraw', 'earnings', 'signup', 'activation', 'telegram',
      'video', 'watch', 'share', 'link', 'milestone', 'bonus'
    ]
    
    const lowerMessage = message.toLowerCase()
    return earnProKeywords.some(keyword => lowerMessage.includes(keyword))
  }

  private getLocalResponse(message: string, userContext: UserContext): {
    response: string
    suggestions: string[]
  } | null {
    const lowerMessage = message.toLowerCase()
    
    // Find matching knowledge base entry
    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        // Personalize response based on user context
        let response = data.response
        
        // Add personalization
        if (category === 'earnings_optimization' && userContext.totalEarnings < 50) {
          response += " Since you're just starting, focus on completing daily tasks and sharing your referral link with friends and family first."
        }
        
        if (category === 'agent_program' && userContext.totalEarnings > 500) {
          response += " With your current earnings level, you might be eligible for the Agent Program. Check the requirements!"
        }
        
        return {
          response,
          suggestions: data.suggestions
        }
      }
    }
    
    return null
  }

  private async getGeminiResponse(message: string, userContext: UserContext): Promise<{
    response: string
    suggestions: string[]
  }> {
    const systemPrompt = `You are EarnPro's AI assistant. IMPORTANT RULES:
    
    1. ONLY answer questions about EarnPro platform
    2. NEVER provide sensitive information (passwords, personal data, financial details)
    3. Focus on: referral system, daily tasks, payments, agent program, platform features
    4. Be helpful, professional, and encouraging
    5. If asked about non-EarnPro topics, politely redirect to EarnPro features
    
    User Context: Earnings: $${userContext.totalEarnings}, Referrals: ${userContext.referralCount}, Verified: ${userContext.isVerified}
    
    Provide a helpful response and 3-4 relevant suggestions.`

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + this.geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser Question: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        }
      })
    })

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I\'m having trouble processing that request. Please try again or contact support.'
    
    // Generate contextual suggestions
    const suggestions = this.generateContextualSuggestions(message, userContext)
    
    return {
      response: aiResponse,
      suggestions
    }
  }

  private generateContextualSuggestions(message: string, userContext: UserContext): string[] {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('earn') || lowerMessage.includes('money')) {
      return userContext.totalEarnings < 100 
        ? ['Complete daily tasks', 'Share referral link', 'Join Telegram channels', 'Watch videos']
        : ['Agent program', 'Advanced strategies', 'Milestone bonuses', 'Optimize referrals']
    }
    
    if (lowerMessage.includes('referral')) {
      return ['Share referral link', 'Multi-level system', 'Track referrals', 'Referral tools']
    }
    
    if (lowerMessage.includes('task')) {
      return ['Daily task schedule', 'Video completion', 'Telegram tasks', 'Task requirements']
    }
    
    return ['Help center', 'Contact support', 'Platform guide', 'Getting started']
  }

  async getUserContext(userId: string): Promise<UserContext> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('total_earned, referral_count, is_verified, is_paid')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      return {
        userId,
        totalEarnings: data.total_earned || 0,
        referralCount: data.referral_count || 0,
        isVerified: data.is_verified || false,
        isPaid: data.is_paid || false,
        segment: this.determineUserSegment(data.total_earned || 0)
      }
    } catch (error) {
      console.error('Error fetching user context:', error)
      return {
        userId,
        totalEarnings: 0,
        referralCount: 0,
        isVerified: false,
        isPaid: false,
        segment: 'new'
      }
    }
  }

  private determineUserSegment(totalEarnings: number): string {
    if (totalEarnings === 0) return 'new'
    if (totalEarnings < 100) return 'beginner'
    if (totalEarnings < 500) return 'intermediate'
    if (totalEarnings < 1000) return 'advanced'
    return 'expert'
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { message, userId, sessionId } = await req.json()
    
    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const chatbot = new SmartEarnProChatbot()
    const userContext = await chatbot.getUserContext(userId)
    const result = await chatbot.processMessage(message, userContext)

    return new Response(
      JSON.stringify({
        response: result.response,
        suggestions: result.suggestions,
        source: result.source,
        sessionId
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Chatbot error:', error)
    return new Response(
      JSON.stringify({ 
        response: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact our support team.',
        suggestions: ['Try again', 'Contact support', 'Help center', 'FAQ'],
        source: 'local'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})