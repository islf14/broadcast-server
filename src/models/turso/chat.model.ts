import { createClient } from '@libsql/client'
import { v4 as uuidv4 } from 'uuid'
import type { ChatDB, StatusChat, UpdChat } from '../../types.js'
import { dbAuthToken, dbUrl } from '../../constants.js'

async function connectChats() {
  const db = createClient({ url: dbUrl, authToken: dbAuthToken })
  try {
    const tb = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='chats'"
    )
    if (tb.rows.length === 0) {
      await db.execute(
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
  // Used in ChatController - newChat

  static create = async (): Promise<string> => {
    let db
    try {
      db = await connectChats()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      let chatId = uuidv4()
      const sql =
        'INSERT INTO chats (id, status, createdAt, updatedAt) VALUES (?, ?, ?, ?)'
      const args = [
        chatId,
        1,
        new Date().toISOString(),
        new Date().toISOString()
      ]
      await db.execute({ sql, args })
      return chatId
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('Error newChat: ' + m)
    } finally {
      db.close()
    }
  }

  // Used in ChatController - closeChat

  static updateStatusByStatus = async ({
    status,
    nStatus
  }: UpdChat): Promise<boolean> => {
    let db
    try {
      db = await connectChats()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      const sql = 'UPDATE chats SET status = ?, updatedAt = ? WHERE status = ?'
      const args = [nStatus, new Date().toISOString(), status]
      await db.execute({ sql, args })
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

  static findByStatus = async ({ status }: StatusChat): Promise<ChatDB> => {
    let db
    try {
      db = await connectChats()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }
    const sql = 'SELECT * FROM chats WHERE status = ?'
    const args = [status]
    const result = await db.execute({ sql, args })
    const data = result.rows[0] as unknown as ChatDB
    db.close()
    return data
  }

  //
}
