import { NextRequest, NextResponse } from 'next/server'
import { getAllChatSessions, getChatSessionMessages, deleteChatSession } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const action = searchParams.get('action')

    if (action === 'sessions') {
      // Get all chat sessions
      const sessions = getAllChatSessions()
      return NextResponse.json({ sessions })
    }

    if (sessionId && action === 'messages') {
      // Get messages for specific session
      const messages = getChatSessionMessages(sessionId)
      return NextResponse.json({ messages })
    }

    if (sessionId && action === 'delete') {
      // Delete specific session
      const result = deleteChatSession(sessionId)
      return NextResponse.json({ 
        success: true, 
        deletedRows: result.changes 
      })
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const result = deleteChatSession(sessionId)
    
    return NextResponse.json({ 
      success: true, 
      deletedRows: result.changes 
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
