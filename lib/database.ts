import sqlite3 from 'sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'cv_database.db')
const db = new sqlite3.Database(dbPath)

// Initialize database tables
export function initDatabase() {
  return new Promise<void>((resolve, reject) => {
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
    `, (err) => {
      if (err) {
        reject(err)
        return
      }
      
      // CV data table (for dynamic updates)
      db.exec(`
        CREATE TABLE IF NOT EXISTS cv_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          section TEXT NOT NULL,
          language TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err)
          return
        }
        
        console.log('Database initialized successfully')
        resolve()
      })
    })
  })
}

// Chat history functions
export function saveChatMessage(sessionId: string, message: string, isUser: boolean, language: string = 'en') {
  return new Promise<sqlite3.RunResult>((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO chat_history (session_id, message, is_user, language)
      VALUES (?, ?, ?, ?)
    `)
    
    stmt.run(sessionId, message, isUser, language, function(this: sqlite3.RunResult, err: any) {
      if (err) {
        reject(err)
      } else {
        resolve(this)
      }
    })
  })
}

export function getChatHistory(sessionId: string, limit: number = 50) {
  return new Promise<any[]>((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT * FROM chat_history 
      WHERE session_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `)
    
    stmt.all(sessionId, limit, (err: any, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows || [])
      }
    })
  })
}

// CV data functions
export function saveCVData(section: string, language: string, data: string) {
  return new Promise<sqlite3.RunResult>((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO cv_data (section, language, data, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `)
    
    stmt.run(section, language, data, function(this: sqlite3.RunResult, err: any) {
      if (err) {
        reject(err)
      } else {
        resolve(this)
      }
    })
  })
}

export function getCVData(section: string, language: string) {
  return new Promise<any>((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT data FROM cv_data 
      WHERE section = ? AND language = ?
    `)
    
    stmt.get(section, language, (err: any, row: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(row ? JSON.parse(row.data) : null)
      }
    })
  })
}

export function getAllCVData(language: string) {
  return new Promise<any>((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT section, data FROM cv_data 
      WHERE language = ?
    `)
    
    stmt.all(language, (err: any, rows: any[]) => {
      if (err) {
        reject(err)
      } else {
        const cvData: any = {}
        rows.forEach((row: any) => {
          cvData[row.section] = JSON.parse(row.data)
        })
        resolve(cvData)
      }
    })
  })
}

export function getAllChatSessions() {
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
    
    stmt.all((err: any, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows || [])
      }
    })
  })
}

export function getChatSessionMessages(sessionId: string) {
  return new Promise<any[]>((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT * FROM chat_history 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `)
    
    stmt.all(sessionId, (err: any, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows || [])
      }
    })
  })
}

export function deleteChatSession(sessionId: string) {
  return new Promise<sqlite3.RunResult>((resolve, reject) => {
    const stmt = db.prepare(`
      DELETE FROM chat_history WHERE session_id = ?
    `)
    
    stmt.run(sessionId, function(this: sqlite3.RunResult, err: any) {
      if (err) {
        reject(err)
      } else {
        resolve(this)
      }
    })
  })
}

// Initialize database on import
initDatabase().catch(console.error)

export default db