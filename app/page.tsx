'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAppContext } from '@/app/providers'
import { CVContent } from '@/components/CVContent'
import { Chatbot } from '@/components/Chatbot'
import { CVUploader } from '@/components/CVUploader'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { isAnimationComplete, setIsAnimationComplete, showChatbot, setShowChatbot } = useAppContext()
  const { t } = useTranslation()
  const [chessSquares, setChessSquares] = useState(Array.from({ length: 64 }, (_, i) => i))

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimationComplete(true)
      // Navigate to chess game after animation
      setTimeout(() => {
        window.location.href = '/chess'
      }, 1000)
    }, 5500) // Increased to 5.5 seconds for longer animation

    return () => clearTimeout(timer)
  }, [setIsAnimationComplete])

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Animated Chess Board Background */}
      {!isAnimationComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="chess-board">
            {chessSquares.map((index) => {
              const row = Math.floor(index / 8)
              const col = index % 8
              const isLight = (row + col) % 2 === 0
              
              return (
                <motion.div
                  key={index}
                  className={`chess-square ${isLight ? 'light' : 'dark'}`}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    rotateY: 180
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotateY: 0,
                    rotateX: [0, 360, 0],
                    rotateZ: [0, 180, 360]
                  }}
                  transition={{
                    duration: 3.0,
                    delay: index * 0.04,
                    ease: "easeInOut"
                  }}
                  whileHover={{
                    scale: 1.1,
                    rotateZ: 5,
                    boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)"
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      {isAnimationComplete && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative z-10"
        >
          <CVContent />
          
          {/* CV Uploader Section */}
          <div className="max-w-4xl mx-auto px-4 py-8">
            <CVUploader />
          </div>
        </motion.div>
      )}

      {/* Chatbot */}
      {showChatbot && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Chatbot />
        </motion.div>
      )}

      {/* Floating Action Button */}
      {isAnimationComplete && !showChatbot && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </motion.button>
      )}
    </main>
  )
}