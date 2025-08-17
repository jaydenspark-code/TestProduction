import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, HelpCircle } from 'lucide-react';
import { ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from "../../lib/supabase";

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      message: 'Hello! I\'m your EarnPro assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
      suggestions: ['How does referral system work?', 'What is the agent program?', 'How to complete tasks?', 'Payment information']
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const knowledgeBase = {
    'referral': {
      keywords: ['referral', 'refer', 'link', 'share', 'invite'],
      response: 'Our referral system allows you to earn money by inviting others to join EarnPro. You earn from direct referrals and up to 3 levels of indirect referrals. Share your unique referral link or QR code to start earning!',
      suggestions: ['How much do I earn per referral?', 'What is multi-level referral?', 'How to share my link?']
    },
    'agent': {
      keywords: ['agent', 'influencer', 'program', 'commission'],
      response: 'The EarnPro Agent Program is for influencers and content creators. Agents get progressive weekly commissions (5-35%), milestone bonuses, and priority withdrawal processing. You need minimum followers on social platforms to apply.',
      suggestions: ['Agent requirements', 'Commission rates', 'How to apply for agent program?']
    },
    'tasks': {
      keywords: ['task', 'video', 'telegram', 'earn', 'complete'],
      response: 'Daily tasks help you earn extra rewards! Complete video watching tasks (80% watch time required) and join Telegram channels. Tasks unlock progressively - complete one to unlock the next.',
      suggestions: ['How to complete video tasks?', 'Telegram task verification', 'Weekly task schedule']
    },
    'payment': {
      keywords: ['payment', 'withdraw', 'money', 'earnings', 'payout'],
      response: 'We now process payments daily! Once you reach the minimum withdrawal amount, you can request a payout and receive your earnings within 24 hours. We support multiple payment methods including PayPal, bank transfer, and cryptocurrency.',
      suggestions: ['Payment methods', 'Minimum withdrawal amount', 'How to withdraw']
    },
    'registration': {
      keywords: ['register', 'signup', 'account', 'verify', 'activation'],
      response: 'To join EarnPro: 1) Register with email, 2) Verify your email, 3) Complete activation payment, 4) Start earning! The activation fee varies by country and is shown in your local currency.',
      suggestions: ['Activation fee amount', 'Email verification', 'Account setup']
    },
    'support': {
      keywords: ['help', 'support', 'contact', 'problem', 'issue'],
      response: 'Need help? Contact our support team via email (support@earnpro.com), live chat, or phone. We\'re available 24/7 for urgent issues and respond within 24 hours for general inquiries.',
      suggestions: ['Contact information', 'Business hours', 'Common issues']
    }
  };

  const quickSuggestions = [
    'How does the referral system work?',
    'What is the agent program?',
    'How to complete daily tasks?',
    'When do I get paid?',
    'How to verify my account?',
    'Contact support'
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const findBestResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();

    for (const [category, data] of Object.entries(knowledgeBase)) {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return data;
      }
    }

    return {
      response: 'I\'m not sure about that specific question. Please try asking about referrals, agent program, tasks, payments, or contact our support team for detailed assistance.',
      suggestions: quickSuggestions.slice(0, 3)
    };
  };

  // Add user context to responses
  const getContextualResponse = (message: string, userProfile: any) => {
    const context = {
      userLevel: userProfile.level,
      totalEarnings: userProfile.total_earnings,
      referralCount: userProfile.referral_count
    };

    // Personalize responses based on user context
    if (message.includes('earnings') && context.totalEarnings < 100) {
      return "I see you're just getting started! Here are some quick ways to boost your earnings...";
    }

    return findBestResponse(message);
  };

  const { user } = useAuth() // Add authentication context
  const [userContext, setUserContext] = useState<any>(null)

  // Fetch user context on mount
  useEffect(() => {
    if (user) {
      fetchUserContext()
    }
  }, [user])

  const fetchUserContext = async () => {
    if (!user || !supabase) return
    
    try {
      const { data } = await supabase
        .from('users')
        .select('total_earned, is_verified, is_paid')
        .eq('id', user.id)
        .single()
      
      setUserContext(data)
    } catch (error) {
      console.error('Error fetching user context:', error)
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: message.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      const res = await fetch('https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/chatbot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}` // Add auth header
        },
        body: JSON.stringify({ 
          message,
          userId: user?.id,
          sessionId: Date.now().toString()
        })
      })
      
      const data = await res.json()

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: data.response,
        isUser: false,
        timestamp: new Date(),
        suggestions: data.suggestions
      }

      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        message: "Sorry, I couldn't reach the assistant. Please try again later.",
        isUser: false,
        timestamp: new Date()
      }]);
    }
    setIsTyping(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  return (
    <>
      {/* Chat Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 animate-pulse"
        >
          <MessageCircle className="w-8 h-8" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">EarnPro Assistant</h3>
                <p className="text-white/70 text-xs">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.isUser ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start space-x-2 ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.isUser ? 'bg-purple-600' : 'bg-blue-600'
                      }`}>
                      {message.isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`rounded-lg p-3 ${message.isUser
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white border border-white/20'
                      }`}>
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {!message.isUser && message.suggestions && (
                    <div className="mt-2 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-3 py-2 rounded-lg border border-white/10 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/20">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
