import path from 'path'

const isServerless = !!process.env.VERCEL || process.env.DISABLE_DB === '1'

// Provide no-op implementations on serverless (Vercel) to avoid SQLITE errors
export function initDatabase() { 
  if (isServerless) return Promise.resolve()
  return initDatabaseLocal()
}

export function saveChatMessage(sessionId: string, message: string, isUser: boolean, language: string = 'en') {
  if (isServerless) return Promise.resolve({} as any)
  return saveChatMessageLocal(sessionId, message, isUser, language)
}

export function getChatHistory(sessionId: string, limit: number = 50) {
  if (isServerless) return Promise.resolve([])
  return getChatHistoryLocal(sessionId, limit)
}

export function saveCVData(section: string, language: string, data: string) {
  if (isServerless) return Promise.resolve({} as any)
  return saveCVDataLocal(section, language, data)
}

export function getCVData(section: string, language: string) {
  if (isServerless) return Promise.resolve(null)
  return getCVDataLocal(section, language)
}

export function getAllCVData(language: string) {
  if (isServerless) return Promise.resolve({})
  return getAllCVDataLocal(language)
}

export function getAllChatSessions() {
  if (isServerless) return Promise.resolve([])
  return getAllChatSessionsLocal()
}

export function getChatSessionMessages(sessionId: string) {
  if (isServerless) return Promise.resolve([])
  return getChatSessionMessagesLocal(sessionId)
}

export function deleteChatSession(sessionId: string) {
  if (isServerless) return Promise.resolve({} as any)
  return deleteChatSessionLocal(sessionId)
}

// Local implementations (only used when not serverless)
let db: any = null

function initDatabaseLocal() {
  const sqlite3 = require('sqlite3') as typeof import('sqlite3')
  const dbPath = path.join(process.cwd(), 'cv_database.db')
  db = new sqlite3.Database(dbPath)

  return new Promise<void>((resolve, reject) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        message TEXT NOT NULL,
        is_user BOOLEAN NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        language TEXT DEFAULT 'en'
      )
    `, (err: any) => {
      if (err) { reject(err); return }
      db.exec(`
        CREATE TABLE IF NOT EXISTS cv_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          section TEXT NOT NULL,
          language TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err: any) => {
        if (err) { reject(err); return }
        console.log('Database initialized successfully')
        resolve()
      })
    })
  })
}

function saveChatMessageLocal(sessionId: string, message: string, isUser: boolean, language: string = 'en') {
  return new Promise<import('sqlite3').RunResult>((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO chat_history (session_id, message, is_user, language)
      VALUES (?, ?, ?, ?)
    `)
    stmt.run(sessionId, message, isUser, language, function(this: import('sqlite3').RunResult, err: any) {
      if (err) reject(err); else resolve(this)
    })
  })
}

function getChatHistoryLocal(sessionId: string, limit: number = 50) {
  return new Promise<any[]>((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT * FROM chat_history 
      WHERE session_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `)
    stmt.all(sessionId, limit, (err: any, rows: any[]) => {
      if (err) reject(err); else resolve(rows || [])
    })
  })
}

function saveCVDataLocal(section: string, language: string, data: string) {
  return new Promise<import('sqlite3').RunResult>((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO cv_data (section, language, data, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `)
    stmt.run(section, language, data, function(this: import('sqlite3').RunResult, err: any) {
      if (err) reject(err); else resolve(this)
    })
  })
}

function getCVDataLocal(section: string, language: string) {
  return new Promise<any>((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT data FROM cv_data 
      WHERE section = ? AND language = ?
    `)
    stmt.get(section, language, (err: any, row: any) => {
      if (err) reject(err); else resolve(row ? JSON.parse(row.data) : null)
    })
  })
}

function getAllCVDataLocal(language: string) {
  return new Promise<any>((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT section, data FROM cv_data 
      WHERE language = ?
    `)
    stmt.all(language, (err: any, rows: any[]) => {
      if (err) reject(err); else {
        const cvData: any = {}
        rows.forEach((row: any) => { cvData[row.section] = JSON.parse(row.data) })
        resolve(cvData)
      }
    })
  })
}

function getAllChatSessionsLocal() {
  return new Promise<any[]>((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT DISTINCT session_id, 
             MIN(timestamp) as first_message,
             MAX(timestamp) as last_message,
             COUNT(*) as message_count
      FROM chat_history 
      GROUP BY session_id 
      ORDER BY last_message DESC
    `)
    stmt.all((err: any, rows: any[]) => {
      if (err) reject(err); else resolve(rows || [])
    })
  })
}

function getChatSessionMessagesLocal(sessionId: string) {
  return new Promise<any[]>((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT * FROM chat_history 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `)
    stmt.all(sessionId, (err: any, rows: any[]) => {
      if (err) reject(err); else resolve(rows || [])
    })
  })
}

function deleteChatSessionLocal(sessionId: string) {
  return new Promise<import('sqlite3').RunResult>((resolve, reject) => {
    const stmt = db.prepare(`
      DELETE FROM chat_history WHERE session_id = ?
    `)
    stmt.run(sessionId, function(this: import('sqlite3').RunResult, err: any) {
      if (err) reject(err); else resolve(this)
    })
  })
}

// Initialize database on import (only if not serverless)
if (!isServerless) {
  initDatabaseLocal().catch(console.error)
}

export default db