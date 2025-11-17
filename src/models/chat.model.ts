import Database from 'libsql'
import { v4 as uuidv4 } from 'uuid'
import { ChatDB, StatusChat, UpdChat } from '../types.js'

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
    let m
    if (e instanceof Error) m = e.message
    throw new Error('error db: ' + m)
  }
}

export class ChatModel {
  //

  static create = (): string => {
    let db
    try {
      db = connectChats()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      let chatId = uuidv4()
      db.prepare(
        'INSERT INTO chats (id, status, createdAt, updatedAt) VALUES (?, ?, ?, ?)'
      ).get(chatId, 1, new Date().toISOString(), new Date().toISOString())
      return chatId
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('Error newChat: ' + m)
    } finally {
      db.close()
    }
  }

  //

  static updateStatusByStatus = ({ status, nStatus }: UpdChat): boolean => {
    let db
    try {
      db = connectChats()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      db.prepare(
        'UPDATE chats SET status = ?, updatedAt = ? WHERE status = ?'
      ).get(nStatus, new Date().toISOString(), status)
      return true
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('Error closing chat: ' + m)
    } finally {
      db.close()
    }
  }

  // ChatController - activeChat

  static findByStatus = ({ status }: StatusChat): ChatDB => {
    let db
    try {
      db = connectChats()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const result = db
      .prepare('SELECT * FROM chats WHERE status = ?')
      .get(status) as ChatDB
    db.close()
    return result
  }

  //
}
