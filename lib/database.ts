import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'cv_database.db')
const db = new Database(dbPath)

// Initialize database tables
export function initDatabase() {
  // Chat history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_user BOOLEAN NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      language TEXT DEFAULT 'en'
    )
  `)

  // CV data table (for dynamic updates)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cv_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL,
      language TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('Database initialized successfully')
}

// Chat history functions
export function saveChatMessage(sessionId: string, message: string, isUser: boolean, language: string = 'en') {
  const stmt = db.prepare(`
    INSERT INTO chat_history (session_id, message, is_user, language)
    VALUES (?, ?, ?, ?)
  `)
  
  return stmt.run(sessionId, message, isUser, language)
}

export function getChatHistory(sessionId: string, limit: number = 50) {
  const stmt = db.prepare(`
    SELECT * FROM chat_history 
    WHERE session_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `)
  
  return stmt.all(sessionId, limit)
}

// CV data functions
export function saveCVData(section: string, language: string, data: string) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO cv_data (section, language, data, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `)
  
  return stmt.run(section, language, data)
}

export function getCVData(section: string, language: string) {
  const stmt = db.prepare(`
    SELECT data FROM cv_data 
    WHERE section = ? AND language = ?
  `)
  
  const result = stmt.get(section, language)
  return result ? JSON.parse(result.data) : null
}

export function getAllCVData(language: string) {
  const stmt = db.prepare(`
    SELECT section, data FROM cv_data 
    WHERE language = ?
  `)
  
  const results = stmt.all(language)
  const cvData: any = {}
  
  results.forEach((row: any) => {
    cvData[row.section] = JSON.parse(row.data)
  })
  
  return cvData
}

export function getAllChatSessions() {
  const stmt = db.prepare(`
    SELECT DISTINCT session_id, 
           MIN(timestamp) as first_message,
           MAX(timestamp) as last_message,
           COUNT(*) as message_count
    FROM chat_history 
    GROUP BY session_id 
    ORDER BY last_message DESC
  `)
  
  return stmt.all()
}

export function getChatSessionMessages(sessionId: string) {
  const stmt = db.prepare(`
    SELECT * FROM chat_history 
    WHERE session_id = ? 
    ORDER BY timestamp ASC
  `)
  
  return stmt.all(sessionId)
}

export function deleteChatSession(sessionId: string) {
  const stmt = db.prepare(`
    DELETE FROM chat_history WHERE session_id = ?
  `)
  
  return stmt.run(sessionId)
}

// Initialize database on import
initDatabase()

export default db

