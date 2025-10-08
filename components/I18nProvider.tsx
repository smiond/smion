'use client'

import { useEffect, useState } from 'react'
import { Suspense } from 'react'
import '@/lib/i18n' // shared i18n setup with normalized locales
import i18next from 'i18next'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Normalize any cached locale like en-US -> en
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem('i18nextLng')
        if (cached && cached.includes('-')) {
          const base = cached.split('-')[0]
          window.localStorage.setItem('i18nextLng', base)
          i18next.changeLanguage(base).catch(() => {})
        }
      }
    } catch {}

    // i18n is initialized in lib/i18n; simply mark ready on mount
    setIsReady(true)
  }, [])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading translations...</div>
      </div>
    }>
      {children}
    </Suspense>
  )
}