'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface JobOffer {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: string
}

export default function JobsAdminPage() {
  const [offers, setOffers] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        // First check localStorage for user's uploads
        const localOffers = localStorage.getItem('jobOffers')
        console.log('localStorage jobOffers:', localOffers)
        if (localOffers) {
          const parsedOffers = JSON.parse(localOffers)
          console.log('Parsed local offers:', parsedOffers)
          if (parsedOffers.length > 0) {
            console.log('Using localStorage offers:', parsedOffers.length)
            setOffers(parsedOffers)
            setLoading(false)
            return
          }
        }
        
        // Fallback to server data (which includes mock data)
        console.log('Falling back to server data')
        const res = await fetch('/api/upload-cv?action=list')
        const data = await res.json()
        console.log('Server data:', data.offers)
        setOffers(data.offers || [])
      } catch (error) {
        console.error('Error loading job offers:', error)
        // Final fallback to localStorage
        const localOffers = localStorage.getItem('jobOffers')
        if (localOffers) {
          setOffers(JSON.parse(localOffers))
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Listen for storage events to update when new uploads happen
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jobOffers' && e.newValue) {
        setOffers(JSON.parse(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Job Offers</h1>
          <p className="text-gray-300">Uploaded job offer PDFs (metadata)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6"
        >
          {loading ? (
            <div>Loading...</div>
          ) : offers.length === 0 ? (
            <div className="text-gray-300">No job offers uploaded.</div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {offers.map((o) => (
                <div key={o.id} className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{o.fileName}</p>
                    <p className="text-xs text-gray-400">{o.fileType} • {(o.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(o.uploadedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}


