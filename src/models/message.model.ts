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
    let m
    if (e instanceof Error) m = e.message
    throw new Error('error db: ' + m)
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
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
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
      return db
        .prepare(
          'SELECT message, username, ord, chat_id, createdAt as date FROM messages WHERE id = ?'
        )
        .get(id) as {
        message: string
        username: string
        ord: number
        chat_id: string
        date: string
      }
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not insert: ' + m)
    }
  }

  //

  static messagesByChatOrder = ({ id, ord }: { id: string; ord: number }) => {
    let db
    try {
      db = connectMessages()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    return db
      .prepare(
        'SELECT message, username, ord, chat_id, createdAt as date FROM messages WHERE chat_id = ? AND ord > ?'
      )
      .all(id, ord) as Array<{
      message: string
      username: string
      ord: number
      chat_id: string
      date: string
    }>
  }

  //
}
