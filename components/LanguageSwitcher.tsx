'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState(languages[0])

  useEffect(() => {
    const current = languages.find(lang => lang.code === i18n.language) || languages[0]
    setCurrentLang(current)
  }, [i18n.language])

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="glass-effect px-4 py-2 flex items-center space-x-2 hover:bg-white/20 transition-all duration-300"
        >
          <span className="text-xl">{currentLang.flag}</span>
          <span className="text-sm font-medium">{currentLang.name}</span>
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </motion.button>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-48 glass-effect rounded-lg overflow-hidden"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/20 transition-colors duration-200 ${
                  currentLang.code === lang.code ? 'bg-white/10' : ''
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

