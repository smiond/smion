'use client'

import { useEffect, useState } from 'react'
import { Suspense } from 'react'
import '@/lib/i18n' // shared i18n setup with normalized locales

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
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