'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function CVUploader() {
  const { t } = useTranslation()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadStatus('error')
      return
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setUploadStatus('error')
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')

    try {
      const formData = new FormData()
      formData.append('job', file)

      console.log('Uploading file:', file.name, file.size, 'bytes')

      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      console.log('Upload response:', result)

      if (response.ok && result.success) {
        setUploadStatus('success')
        console.log('Job offer uploaded successfully:', result.data)
        
        // Save to localStorage for persistence
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('')
        const base64 = btoa(binaryString)
        
        const jobOffer = {
          id: Date.now().toString(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date().toISOString(),
          fileData: base64 // Store file content as base64
        }
        
        const existingOffers = JSON.parse(localStorage.getItem('jobOffers') || '[]')
        console.log('Existing offers before add:', existingOffers)
        existingOffers.push(jobOffer)
        console.log('New offers array:', existingOffers)
        localStorage.setItem('jobOffers', JSON.stringify(existingOffers))
        console.log('Saved to localStorage:', localStorage.getItem('jobOffers'))
        
        // Trigger storage event for admin page
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'jobOffers',
          newValue: JSON.stringify(existingOffers)
        }))
      } else {
        console.error('Upload failed:', result.error)
        setUploadStatus('error')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect p-6 rounded-xl"
    >
      <div className="flex items-center space-x-3 mb-4">
        <FileText className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold">Upload Your Offer</h3>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-400 bg-blue-500/10'
            : uploadStatus === 'success'
            ? 'border-green-400 bg-green-500/10'
            : uploadStatus === 'error'
            ? 'border-red-400 bg-red-500/10'
            : 'border-gray-400 hover:border-blue-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300">Processing your CV...</p>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-400" />
            <p className="text-green-400 font-medium">Job offer uploaded successfully!</p>
            <p className="text-sm text-gray-400">Your offer metadata has been stored.</p>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-red-400 font-medium">Upload failed</p>
            <p className="text-sm text-gray-400">Please make sure you're uploading a valid PDF file (max 5MB).</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium mb-2">Drop your job offer (PDF) here or click to browse</p>
              <p className="text-sm text-gray-400">Only PDF files are supported</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>• Upload job offers in PDF format (max 5MB)</p>
        <p>• We store only metadata (filename, size, type)</p>
      </div>
    </motion.div>
  )
}

