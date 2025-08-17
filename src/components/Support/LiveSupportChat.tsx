import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, Bot, User, Minimize2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  isTyping?: boolean
  suggestions?: string[]
  confidence?: number
}

interface LiveSupportChatProps {
  isOpen: boolean
  onClose: () => void
}

const LiveSupportChat: React.FC<LiveSupportChatProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hi${user?.fullName ? ` ${user.fullName.split(' ')[0]}` : ''}! 👋 I'm your EarnPro support assistant. I can help with referrals, tasks, payments, account issues, and general questions. What can I help you with today?`,
      isUser: false,
      timestamp: new Date(),
      suggestions: ['Referral system', 'Daily tasks', 'Payment methods', 'Account verification', 'Technical issues']
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [supportLevel, setSupportLevel] = useState<'ai' | 'human'>('ai')

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage.trim()
    setInputMessage('')
    setIsTyping(true)

    try {
      // Enhanced AI chat with better context
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          userId: user?.id,
          context: 'support',
          previousMessages: messages.slice(-5).map(m => ({
            id: m.id,
            content: m.content,
            isUser: m.isUser,
            timestamp: m.timestamp
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Check if human escalation is needed
      if (data.requiresHuman && supportLevel === 'ai') {
        setSupportLevel('human')
        
        // Add escalation message
        const escalationMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, escalationMessage])
        
        // Notify human agents
        await notifyHumanAgents(currentMessage, user?.id)
        
        // Add human agent connecting message
        setTimeout(() => {
          const connectingMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: `🔄 Connecting you with a support agent... Average wait time: ${getEstimatedWaitTime()}`,
            isUser: false,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, connectingMessage])
        }, 1000)
        
        setIsTyping(false)
        return
      }

      // Add AI response with suggestions
      const aiMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
        suggestions: data.suggestions,
        confidence: data.confidence
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Show confidence indicator for low confidence responses
      if (data.confidence < 0.7) {
        setTimeout(() => {
          const followUpMessage: Message = {
            id: (Date.now() + 3).toString(),
            content: "I'm not completely sure about this answer. Would you like me to connect you with a human agent for more accurate assistance?",
            isUser: false,
            timestamp: new Date(),
            suggestions: ['Yes, connect me', 'No, that helps', 'Try different question', 'Contact support']
          }
          setMessages(prev => [...prev, followUpMessage])
        }, 2000)
      }
      
    } catch (error) {
      console.error('Support chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        content: '❌ I\'m experiencing technical difficulties. Let me connect you with a human agent who can help you right away.',
        isUser: false,
        timestamp: new Date(),
        suggestions: ['Connect with agent', 'Try again', 'Email support', 'Call support']
      }
      setMessages(prev => [...prev, errorMessage])
      
      // Auto-escalate on technical failures
      setSupportLevel('human')
      await notifyHumanAgents(currentMessage, user?.id)
    } finally {
      setIsTyping(false)
    }
  }

  const getEstimatedWaitTime = (): string => {
    const hour = new Date().getHours()
    // Business hours: shorter wait times
    if (hour >= 9 && hour <= 17) {
      return '2-5 minutes'
    }
    // After hours: longer wait times
    return '5-15 minutes'
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === 'Yes, connect me' || suggestion === 'Connect with agent') {
      setSupportLevel('human')
      const connectingMessage: Message = {
        id: Date.now().toString(),
        content: '🔄 Connecting you with a human support agent. Please hold on...',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, connectingMessage])
      notifyHumanAgents('User requested human agent connection', user?.id)
      return
    }
    
    if (suggestion === 'No, that helps') {
      const thankYouMessage: Message = {
        id: Date.now().toString(),
        content: '😊 Great! I\'m glad I could help. Is there anything else you\'d like to know about EarnPro?',
        isUser: false,
        timestamp: new Date(),
        suggestions: ['Referral help', 'Task questions', 'Payment info', 'Account settings']
      }
      setMessages(prev => [...prev, thankYouMessage])
      return
    }
    
    // Handle other suggestions by sending as message
    setInputMessage(suggestion)
    handleSendMessage()
  }

  const notifyHumanAgents = async (message: string, userId?: string) => {
    try {
      await fetch('/api/support/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId,
          priority: 'high',
          source: 'live_chat'
        })
      })
    } catch (error) {
      console.error('Failed to notify human agents:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white rounded-lg shadow-2xl border transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">
              {supportLevel === 'ai' ? 'AI Support' : 'Human Agent'}
            </span>
            {supportLevel === 'human' && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 ${
                    message.isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!message.isUser && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div className="flex flex-col max-w-xs">
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                        {!message.isUser && message.confidence && message.confidence < 0.8 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                            ~{Math.round(message.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Suggestions */}
                    {!message.isUser && message.suggestions && (
                      <div className="mt-2 space-y-1">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 px-3 py-2 rounded-lg border border-blue-200 transition-colors"
                          >
                            💡 {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.isUser && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default LiveSupportChat
