'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface AppContextType {
  isAnimationComplete: boolean
  setIsAnimationComplete: (value: boolean) => void
  showChatbot: boolean
  setShowChatbot: (value: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)

  return (
    <AppContext.Provider value={{
      isAnimationComplete,
      setIsAnimationComplete,
      showChatbot,
      setShowChatbot
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within a Providers')
  }
  return context
}

