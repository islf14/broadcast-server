import Database from 'libsql'
import { v4 as uuidv4 } from 'uuid'

function connectChats() {
  const db = new Database('./data.db')
  try {
    const tb = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='chats'"
      )
      .get()
    if (tb === undefined) {
      db.exec(
        'CREATE TABLE chats (id BLOB PRIMARY KEY, status NUMERIC, createdAt TEXT, updatedAt TEXT)'
      )
    }
    return db
  } catch (e: unknown) {
    let message
    if (e instanceof Error) message = e.message
    throw new Error('error db: ' + message)
  }
}

export class ChatController {
  static create = () => {
    let db
    try {
      db = connectChats()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('Error connecting: ' + message)
    }

    try {
      db.prepare(
        'INSERT INTO chats (id, status, createdAt, updatedAt) VALUES (?, ?, ?, ?)'
      ).get(uuidv4(), 1, new Date().toISOString(), new Date().toISOString())
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('Error newChat: ' + message)
    }
    const chats = db.prepare('SELECT * FROM chats').all()
    return chats
  }

  static closeChat = () => {
    let db
    try {
      db = connectChats()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('Error connecting: ' + message)
    }

    try {
      db.prepare(
        'UPDATE chats SET status = ?, updatedAt = ? WHERE status = ?'
      ).get(0, new Date().toISOString(), 1)
      return true
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('Error closing chat: ' + message)
    }
  }
}
