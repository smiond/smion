'use client'

import { useEffect } from 'react'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false, // Turn off debug to reduce console noise
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    ns: ['common'],
    defaultNS: 'common',
    react: {
      useSuspense: false, // Disable suspense to prevent loading issues
    },
  })

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // You can add any i18n-related logic here if needed
  }, [])

  return <>{children}</>
}