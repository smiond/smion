import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload CV API called')
    
    const formData = await request.formData()
    const file = formData.get('cv') as File
    
    if (!file) {
      console.log('No file uploaded')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    
    if (file.type !== 'application/pdf') {
      console.log('Invalid file type:', file.type)
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }
    
    console.log('File received:', file.name, file.size, 'bytes')
    
    // For now, just return success without parsing
    // This confirms the route is working
    return NextResponse.json({
      success: true,
      message: 'CV uploaded successfully (basic version)',
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        message: 'PDF parsing will be added back once basic upload is confirmed'
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

