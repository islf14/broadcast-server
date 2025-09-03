import Database from 'libsql'
import { Socket } from 'socket.io'
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
        'CREATE TABLE messages (id BLOB PRIMARY KEY, message TEXT, username TEXT, chat_id BLOB, createdAt TEXT, updatedAt TEXT)'
      )
    }
    return db
  } catch (e: unknown) {
    let message
    if (e instanceof Error) message = e.message
    throw new Error('error db: ' + message)
  }
}

export class MessageController {
  //

  static create = ({
    socket,
    msg,
    idChat
  }: {
    socket: Socket
    msg: string
    idChat: string
  }) => {
    let db
    try {
      db = connectMessages()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('Error connecting: ' + message)
    }

    try {
      db.prepare(
        'INSERT INTO messages (id, message, username, chat_id, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
      ).get(
        uuidv4(),
        msg,
        socket.handshake.auth.username,
        idChat,
        new Date().toISOString(),
        new Date().toISOString()
      )
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error: ', message)
    }
    console.log(socket.handshake.auth.username + ': ', msg)

    const messages = db.prepare('SELECT * FROM messages').all()
    console.log(messages)
  }

  //
}
