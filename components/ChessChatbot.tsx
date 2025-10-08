'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Send, X, Bot, User } from 'lucide-react'
import { useAppContext } from '@/app/providers'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface ChessChatbotProps {
  questionCount: number
  maxQuestionsPerMove: number
  onQuestionAsked: () => void
  totalQuestionsAsked: number
}

export function ChessChatbot({ questionCount, maxQuestionsPerMove, onQuestionAsked, totalQuestionsAsked }: ChessChatbotProps) {
  const { t } = useTranslation()
  const { setShowChatbot } = useAppContext()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Smion CV: " + t('chatbot.title'),
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    // Check if user has exceeded question limit
    if (questionCount >= maxQuestionsPerMove) {
      const limitMessage: Message = {
        id: Date.now().toString(),
        text: t('chess.question_limit_warning'),
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, limitMessage])
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 30000) // 30s timeout

    try {

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          // let server auto-detect language
          sessionId: sessionId
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      let data: any = { response: undefined, sessionId: undefined }
      try {
        data = await response.json()
      } catch (e) {
        // ignore JSON parse error, will handle below
      }

      if (!response.ok) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data?.response || 'Sorry, there was an error (server returned non-OK). Please try again shortly.',
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
        return
      }

      // Set sessionId from response if not already set
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId)
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I could not process your request.',
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      onQuestionAsked() // Notify parent component that a question was asked
    } catch (error: any) {
      clearTimeout(timeoutId)
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error?.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : 'Sorry, there was an error processing your message. Please try again.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Smion CV</h3>
            <p className="text-xs text-gray-300">
              {t('chess.questions')}: {questionCount}/{maxQuestionsPerMove}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowChatbot(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-white/20 text-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  {!message.isUser && (
                    <Bot className="w-4 h-4 mt-1 text-blue-300 flex-shrink-0" />
                  )}
                  {message.isUser && (
                    <User className="w-4 h-4 mt-1 text-white flex-shrink-0" />
                  )}
                  <div className="text-sm leading-relaxed">
                    {message.text}
                  </div>
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/20 text-white p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-300" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input or Options after 5 questions */}
      <div className="p-4 border-t border-white/20">
        {totalQuestionsAsked >= 5 ? (
          <div className="space-y-3">
            <p className="text-sm text-white text-center mb-3">
              {t('chess.cv_options_title')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/cv'}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-2 px-3 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                {t('chess.view_cv')}
              </button>
              <button
                onClick={() => setShowChatbot(false)}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-3 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                {t('chess.continue_chess')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  questionCount >= maxQuestionsPerMove 
                    ? t('chess.make_move_to_ask')
                    : t('chess.ask_about_smion')
                }
                disabled={isLoading || questionCount >= maxQuestionsPerMove}
                className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading || questionCount >= maxQuestionsPerMove}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white p-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {questionCount >= maxQuestionsPerMove && (
              <p className="text-xs text-yellow-300 mt-2 text-center">
                {t('chess.question_limit_warning')}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
