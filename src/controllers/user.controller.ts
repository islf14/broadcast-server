import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Server, Socket } from 'socket.io'
import Database from 'libsql'
import { ChatController } from './chat.controller'

function connectUsers() {
  const db = new Database('./data.db')
  try {
    const tb = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      )
      .get()
    if (tb === undefined) {
      db.exec(
        'CREATE TABLE users (id BLOB PRIMARY KEY, name TEXT, status NUMERIC, createdAt TEXT, updatedAt TEXT)'
      )
    }
    return db
  } catch (e) {
    let message
    if (e instanceof Error) message = e.message
    throw new Error('error db: ' + message)
  }
}

export class UserController {
  ////

  users = (_req: Request, res: Response) => {
    const db = connectUsers()
    const row = db.prepare('SELECT * FROM users').all()
    console.log(row)
    return res.status(200).json(row)
  }

  //
  //

  static login = ({
    io,
    socket,
    name
  }: {
    io: Server
    socket: Socket
    name: string
  }) => {
    console.log('/login name:', name)
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error: ', message)
      socket.emit('server:errorlogin')
      return
    }
    const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name)
    if (user) {
      socket.emit('server:errorlogin')
      return
    }

    // New User
    try {
      db.prepare(
        'INSERT INTO users (id, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
      ).get(
        uuidv4(),
        name,
        1,
        new Date().toISOString(),
        new Date().toISOString()
      )
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error', message)
      socket.emit('server:errorlogin')
      return
    }

    // New Chat
    const allusers = db.prepare('SELECT * FROM users').all() as Array<{
      id: string
      name: string
      status: number
    }>
    if (allusers.length === 1) {
      try {
        ChatController.create()
        console.log('chat created')
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        console.log('Error!!!: ', message)
        // delete user
        db.prepare('DELETE FROM users WHERE id = ?').get(allusers[0].id)
        socket.emit('server:errorlogin')
        return
      }
    }

    // login ok
    socket.handshake.auth.username = name
    socket.emit('server:loginok')
    UserController.emitUsersEveryone({ io })
  }

  //
  //

  static vlogin = ({
    io,
    socket,
    name
  }: {
    io: Server
    socket: Socket
    name: string
  }) => {
    console.log('/vlogin name: ', name)
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error: ', message)
      socket.emit('server:errorvflogin')
      return
    }
    const user = db
      .prepare('SELECT * FROM users WHERE name = ? AND status = ?')
      .get(name, 0) as {
      id: string
      name: string
      status: number
    }
    if (user) {
      // login ok
      try {
        db.prepare(
          'UPDATE users SET status = ?, updatedAt = ? WHERE id = ?'
        ).get(1, new Date().toISOString(), user.id)
        socket.emit('server:vfloginok')
        UserController.emitUsersEveryone({ io })
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        console.log('Error: ', message)
        socket.emit('server:errorvflogin')
      }
    } else socket.emit('server:errorvflogin')
  }

  //
  // A L L  U S E R S

  static emitUsersEveryone = ({ io }: { io: Server }) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error: ', message)
      return
    }
    const allUsers = db
      .prepare('SELECT * FROM users WHERE status = 1')
      .all() as Array<{
      id: string
      name: string
      status: number
    }>
    console.log('Emit to Everyone')
    io.emit('server:users', allUsers)
  }

  static logoutEmitUsers = ({ socket }: { socket: Socket }) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error: ', message)
      return
    }
    const allUsers = db
      .prepare('SELECT * FROM users WHERE status = 1')
      .all() as Array<{
      id: string
      name: string
      status: number
    }>
    console.log('Emit broadcast')
    socket.broadcast.emit('server:users', allUsers)
  }

  static disconnectEmitUsers = ({ socket }: { socket: Socket }) => {
    setTimeout(() => {
      let db
      try {
        db = connectUsers()
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        console.log('Error: ', message)
        return
      }
      // verify status
      const user = db
        .prepare('SELECT * FROM users WHERE name = ?')
        .get(socket.handshake.auth.username) as { status: number }

      if (user && user.status === 0) {
        // Emit because disconnection
        const allUsers = db
          .prepare('SELECT * FROM users WHERE status = 1')
          .all() as Array<{
          id: string
          name: string
          status: number
        }>
        console.log(
          '/disconnectEmitUsers: ',
          socket.id + ' ' + socket.handshake.auth.username
        )
        socket.broadcast.emit('server:users', allUsers)

        // Last user
        const activeUsers = db
          .prepare('SELECT * FROM users WHERE status = ?')
          .all(1)
        if (activeUsers.length === 0) {
          try {
            ChatController.closeChat()
            UserController.deleteAll()
            console.log('Chat closed')
          } catch (e: unknown) {
            let message
            if (e instanceof Error) message = e.message
            console.log('Error: ', message)
          }
        }
      } else console.log('...page realoaded')
    }, 2000)
  }

  //

  static logout = ({ socket }: { socket: Socket }) => {
    console.log('/logout: ', socket.handshake.auth.username)
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error: ', message)
      return
    }

    try {
      db.prepare(
        'UPDATE users SET status = ?, updatedAt = ? WHERE name = ?'
      ).get(0, new Date().toISOString(), socket.handshake.auth.username)
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error: ', message)
    }
  }

  static logoutAll = () => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error: ', message)
      return
    }

    const allUsers = db
      .prepare('SELECT * FROM users WHERE status = 1')
      .all() as Array<{
      id: string
    }>
    allUsers.forEach((user) => {
      db.prepare('UPDATE users SET status = ?, updatedAt = ? WHERE id = ?').get(
        0,
        new Date().toISOString(),
        user.id
      )
    })
  }

  static deleteAll = () => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error: ', message)
      return
    }

    db.exec('DELETE FROM users')
  }

  //
}
