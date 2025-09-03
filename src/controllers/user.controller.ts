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
  }): string => {
    console.log('/login name:', name)
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      // console.log('Error: ', message)
      socket.emit('server:errorlogin')
      throw new Error('can not connect: ' + message)
    }
    const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name)
    if (user) {
      socket.emit('server:errorlogin')
      throw new Error('User already exists')
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
      // console.log('Error', message)
      socket.emit('server:errorlogin')
      throw new Error('can not insert: ' + message)
    }

    // New Chat
    const allusers = db.prepare('SELECT * FROM users').all() as Array<{
      id: string
      name: string
      status: number
    }>
    let idChat: string = ''
    if (allusers.length === 1) {
      try {
        idChat = ChatController.create()
        console.log('chat created')
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        // console.log('Error!!!: ', message)
        // delete user
        db.prepare('DELETE FROM users WHERE id = ?').get(allusers[0].id)
        socket.emit('server:errorlogin')
        throw new Error('can not create chat: ' + message)
      }
    }

    // login ok
    socket.handshake.auth.username = name
    socket.emit('server:loginok')
    UserController.emitUsersEveryone({ io })
    return idChat
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

  static logoutEmitUsers = ({ socket }: { socket: Socket }): boolean => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    const allUsers = db
      .prepare('SELECT * FROM users WHERE status = ?')
      .all(1) as Array<{
      id: string
      name: string
      status: number
    }>

    // finish chat
    let endChat = false
    if (allUsers.length === 0) {
      // Last user
      try {
        ChatController.closeChat()
        endChat = true
        UserController.deleteAll()
        console.log('Chat closed')
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        console.log('Error: ', message)
      }
    } else {
      console.log('Emit broadcast')
      socket.broadcast.emit('server:users', allUsers)
    }
    return endChat
  }

  static disconnectEmitUsers = async ({
    socket
  }: {
    socket: Socket
  }): Promise<boolean> => {
    const status = await new Promise<boolean>((resolve) => {
      setTimeout(() => {
        let db
        try {
          db = connectUsers()
        } catch (e: unknown) {
          let message
          if (e instanceof Error) message = e.message
          console.log('Error: ', message)
          throw new Error('can not connect: ' + message)
        }

        // verify status
        const user = db
          .prepare('SELECT * FROM users WHERE name = ?')
          .get(socket.handshake.auth.username) as { status: number }

        let endChat = false
        if (user && user.status === 0) {
          // Emit because disconnection
          endChat = UserController.logoutEmitUsers({ socket })
        } else console.log('...page realoaded')
        resolve(endChat)
      }, 2000)
    })
    return status
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
