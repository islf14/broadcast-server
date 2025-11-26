import { createClient } from '@libsql/client'
import { v4 as uuidv4 } from 'uuid'
import { Messages, MessageDB, NewMessage } from '../../types.js'
import { dbAuthToken, dbUrl } from '../../constants.js'

async function connectMessages() {
  const db = createClient({ url: dbUrl, authToken: dbAuthToken })
  try {
    const tb = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='messages'"
    )
    if (tb.rows.length === 0) {
      await db.execute(
        'CREATE TABLE messages (id BLOB PRIMARY KEY, message TEXT, username TEXT, ord NUMERIC, chatId BLOB, createdAt TEXT, updatedAt TEXT)'
      )
    }
    return db
  } catch (e: unknown) {
    let m
    if (e instanceof Error) m = e.message
    throw new Error('db error: ' + m)
  }
}

export class MessageModel {
  //
  // MessageController - create

  static create = async ({
    message,
    username,
    chatId
  }: NewMessage): Promise<MessageDB> => {
    let db
    try {
      db = await connectMessages()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      let sql = 'SELECT MAX(ord) as max FROM messages WHERE chatId = ?'
      let args: Array<string | number> = [chatId]
      const orderRes = await db.execute({ sql, args })
      const order = orderRes.rows[0] as unknown as { max: number }

      const id = uuidv4()
      sql =
        'INSERT INTO messages (id, message, username, ord, chatId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      args = [
        id,
        message,
        username,
        order.max ? order.max + 1 : 1,
        chatId,
        new Date().toISOString(),
        new Date().toISOString()
      ]
      await db.execute({ sql, args })

      sql =
        'SELECT message, username, ord, createdAt as date FROM messages WHERE id = ?'
      args = [id]
      const result = await db.execute({ sql, args })
      const data = result.rows[0] as unknown as MessageDB
      return data
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not insert: ' + m)
    } finally {
      db.close()
    }
  }

  // MessageController - loadMessages

  static messagesOrder = async ({
    chatId,
    ord
  }: Messages): Promise<Array<MessageDB>> => {
    let db
    try {
      db = await connectMessages()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }
    const sql =
      'SELECT message, username, ord, createdAt as date FROM messages WHERE chatId = ? AND ord > ? ORDER BY ord ASC'
    const args = [chatId, ord]
    const result = await db.execute({ sql, args })
    const data = result.rows as unknown as Array<MessageDB>
    db.close()
    return data
  }

  //
}
