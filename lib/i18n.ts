import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    supportedLngs: ['en', 'hr', 'de'],
    nonExplicitSupportedLngs: true,
    ns: ['common'],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false,
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Normalize language codes to match our folder structure
    load: 'languageOnly',
    cleanCode: true,
    
    detection: {
      order: ['navigator', 'htmlTag'],
      caches: [],
    },

    react: {
      useSuspense: true,
    },
  })

export default i18n

