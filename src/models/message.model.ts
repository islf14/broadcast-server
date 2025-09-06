import Database from 'libsql'
import { v4 as uuidv4 } from 'uuid'

function connectMessages() {
  const db = new Database('./data.db')
  try {
    const tb = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='messages'"
      )
      .get()
    if (tb === undefined) {
      db.exec(
        'CREATE TABLE messages (id BLOB PRIMARY KEY, message TEXT, username TEXT, ord NUMERIC, chat_id BLOB, createdAt TEXT, updatedAt TEXT)'
      )
    }
    return db
  } catch (e: unknown) {
    let message
    if (e instanceof Error) message = e.message
    throw new Error('error db: ' + message)
  }
}

export class MessageModel {
  //

  static create = ({
    message,
    username,
    idChat
  }: {
    message: string
    username: string
    idChat: string
  }) => {
    let db
    try {
      db = connectMessages()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    try {
      const order = db
        .prepare('SELECT MAX(ord) as max FROM messages WHERE chat_id = ?')
        .get(idChat) as { max: number }
      const id = uuidv4()
      db.prepare(
        'INSERT INTO messages (id, message, username, ord, chat_id, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).get(
        id,
        message,
        username,
        order.max ? order.max + 1 : 1,
        idChat,
        new Date().toISOString(),
        new Date().toISOString()
      )
      return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as {
        message: string
        username: string
        ord: number
        chat_id: string
        createdAt: string
      }
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not insert: ' + message)
    }
  }

  //

  static messagesByChat = ({ id }: { id: string }) => {
    let db
    try {
      db = connectMessages()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    return db
      .prepare(
        'SELECT id, message, username, ord, chat_id, createdAt as date FROM messages WHERE chat_id = ?'
      )
      .all(id) as Array<{
      message: string
      username: string
      ord: number
      chat_id: string
      date: string
    }>
  }

  //
}
