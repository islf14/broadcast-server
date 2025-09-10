import Database from 'libsql'
import { v4 as uuidv4 } from 'uuid'
import { StatusChat, UpdateChat } from '../types.js'

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

  static create = () => {
    let db
    try {
      db = connectChats()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      let idChat = uuidv4()
      db.prepare(
        'INSERT INTO chats (id, status, createdAt, updatedAt) VALUES (?, ?, ?, ?)'
      ).get(idChat, 1, new Date().toISOString(), new Date().toISOString())
      return idChat
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('Error newChat: ' + m)
    }
  }

  //

  static updateStatusByStatus = ({ status, newStatus }: UpdateChat) => {
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
      ).get(newStatus, new Date().toISOString(), status)
      return true
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('Error closing chat: ' + m)
    }
  }

  //

  static findByStatus = ({ status }: StatusChat) => {
    let db
    try {
      db = connectChats()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    return db.prepare('SELECT * FROM chats WHERE status = ?').get(status) as {
      id: string
    }
  }

  //
}
