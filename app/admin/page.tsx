'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ChatSession {
  session_id: string
  first_message: string
  last_message: string
  message_count: number
}

interface ChatMessage {
  id: number
  session_id: string
  message: string
  is_user: boolean
  timestamp: string
  language: string
}

export default function ChatAdminPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [jobOffers, setJobOffers] = useState<any[]>([])

  useEffect(() => {
    fetchSessions()
    fetchJobOffers()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/chat-sessions?action=sessions')
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat-sessions?sessionId=${sessionId}&action=messages`)
      const data = await response.json()
      setMessages(data.messages || [])
      setSelectedSession(sessionId)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchJobOffers = async () => {
    try {
      const res = await fetch('/api/upload-cv?action=list')
      const data = await res.json()
      setJobOffers(data.offers || [])
    } catch (e) {
      console.error('Error fetching job offers', e)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat session?')) return

    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })

      if (response.ok) {
        setSessions(sessions.filter(s => s.session_id !== sessionId))
        if (selectedSession === sessionId) {
          setSelectedSession(null)
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading chat sessions...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">Chat Sessions Admin</h1>
          <p className="text-gray-300">Review and manage chat conversations</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6"
          >
            <h2 className="text-2xl font-semibold mb-4">Chat Sessions ({sessions.length})</h2>
            
            {sessions.length === 0 ? (
              <p className="text-gray-300">No chat sessions found.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedSession === session.session_id
                        ? 'bg-blue-500/20 border-blue-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => fetchMessages(session.session_id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 mb-1">
                          Session: {session.session_id.substring(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          {session.message_count} messages
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(session.last_message)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession(session.session_id)
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Messages */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6"
          >
            <h2 className="text-2xl font-semibold mb-4">
              Messages {selectedSession && `(${messages.length})`}
            </h2>
            
            {!selectedSession ? (
              <p className="text-gray-300">Select a session to view messages.</p>
            ) : messages.length === 0 ? (
              <p className="text-gray-300">No messages found for this session.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.is_user
                        ? 'bg-blue-500/20 ml-8'
                        : 'bg-green-500/20 mr-8'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">
                        {message.is_user ? 'User' : 'AI'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Language: {message.language}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        {/* Job Offers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mt-6"
        >
          <h2 className="text-2xl font-semibold mb-4">Job Offers ({jobOffers.length})</h2>
          {jobOffers.length === 0 ? (
            <p className="text-gray-300">No job offers uploaded.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {jobOffers.map((o) => (
                <div key={o.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{o.file_name}</p>
                      <p className="text-xs text-gray-400">{o.file_type} • {(o.file_size / 1024).toFixed(1)} KB</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(o.uploaded_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </main>
  )
}
