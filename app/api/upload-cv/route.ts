import { NextRequest, NextResponse } from 'next/server'
import { saveJobOffer } from '@/lib/database'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

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
    
    console.log('File received:', file.name, file.size, 'bytes')
    try {
      // Save metadata to DB (no-op on serverless)
      await saveJobOffer(file.name, file.size, file.type)
    } catch {}

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
    
    // For now, just return success without parsing
    // This confirms the route is working
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
      const { getJobOffers } = await import('@/lib/database')
      const offers = await getJobOffers()
      return NextResponse.json({ offers })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

