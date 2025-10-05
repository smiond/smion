'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { CVContent } from '@/components/CVContent'
import { CVUploader } from '@/components/CVUploader'
import { Chatbot } from '@/components/Chatbot'

export default function CVPage() {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <LanguageSwitcher />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">{t('cv.title')}</h1>
          <p className="text-gray-300 mb-6">{t('cv.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CV Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-effect p-6 rounded-lg"
          >
            <CVContent />
          </motion.div>

          {/* CV Uploader and Chatbot */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="glass-effect p-6 rounded-lg">
              <CVUploader />
            </div>
            
            <div className="glass-effect p-6 rounded-lg">
              <Chatbot />
            </div>
          </motion.div>
        </div>

        {/* Back to Chess Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-8"
        >
          <button
            onClick={() => window.location.href = '/chess'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
          >
            {t('cv.back_to_chess')}
          </button>
        </motion.div>
      </div>
    </main>
  )
}
