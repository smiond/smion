import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// In-memory storage for job offers (works on Vercel)
let jobOffersMemory: JobOffer[] = [
  // Mock data for demonstration (no file data)
  {
    id: 'demo-1',
    fileName: 'Sample Job Offer.pdf',
    fileSize: 245760,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  }
]

// File storage for local development
const JOBS_FILE = path.join(process.cwd(), 'data', 'job-offers.json')

interface JobOffer {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: string
  fileData?: string // Base64 encoded file content
}

async function saveJobOffer(fileName: string, fileSize: number, fileType: string): Promise<JobOffer> {
  const jobOffer: JobOffer = {
    id: Date.now().toString(),
    fileName,
    fileSize,
    fileType,
    uploadedAt: new Date().toISOString()
  }

  if (process.env.VERCEL) {
    // Use in-memory storage on Vercel
    jobOffersMemory.push(jobOffer)
    return jobOffer
  } else {
    // Use file storage locally
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(JOBS_FILE)
      await fs.promises.mkdir(dataDir, { recursive: true })
      
      // Read existing offers
      let offers: JobOffer[] = []
      try {
        const data = await fs.promises.readFile(JOBS_FILE, 'utf-8')
        offers = JSON.parse(data)
      } catch {
        // File doesn't exist yet, start with empty array
      }
      
      // Add new offer
      offers.push(jobOffer)
      
      // Save back to file
      await fs.promises.writeFile(JOBS_FILE, JSON.stringify(offers, null, 2))
      
      return jobOffer
    } catch (error) {
      console.error('Error saving job offer:', error)
      throw error
    }
  }
}

async function getJobOffers(): Promise<JobOffer[]> {
  if (process.env.VERCEL) {
    // Use in-memory storage on Vercel
    return jobOffersMemory
  } else {
    // Use file storage locally
    try {
      const data = await fs.promises.readFile(JOBS_FILE, 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Upload Job Offer API called')
    
    const formData = await request.formData()
    const file = formData.get('job') as File
    
    if (!file) {
      console.log('No file uploaded')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    
    if (file.type !== 'application/pdf') {
      console.log('Invalid file type:', file.type)
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.log('File too large:', file.size, 'bytes')
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      }, { status: 413 })
    }
    
    console.log('File received:', file.name, file.size, 'bytes')
    console.log('Environment:', process.env.VERCEL ? 'Vercel' : 'Local')
    
    // Save metadata to JSON file
    const jobOffer = await saveJobOffer(file.name, file.size, file.type)
    console.log('Job offer saved:', jobOffer.id)
    
    // Save file to disk when not serverless
    try {
      if (!process.env.VERCEL && process.env.DISABLE_FILE_SAVE !== '1') {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'jobs')
        await fs.promises.mkdir(uploadsDir, { recursive: true })
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const outPath = path.join(uploadsDir, `${Date.now()}_${safeName}`)
        await fs.promises.writeFile(outPath, buffer)
      }
    } catch (e) {
      console.warn('File save skipped/failed:', (e as Error)?.message)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Job offer uploaded successfully',
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        message: 'Stored metadata; file saved to /uploads/jobs (local only)'
      }
    })
    
  } catch (error) {
    console.error('Error processing CV upload:', error)
    return NextResponse.json(
      { error: 'Failed to process CV upload: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    if (action === 'list') {
      const offers = await getJobOffers()
      console.log('Getting job offers:', offers.length, 'offers found')
      console.log('Environment:', process.env.VERCEL ? 'Vercel' : 'Local')
      return NextResponse.json({ offers })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Error in GET:', e)
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

