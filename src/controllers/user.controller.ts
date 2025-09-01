import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Server, Socket } from 'socket.io'
import Database from 'libsql'

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
  } catch (error) {
    throw new Error('Error in db')
  }
}

export class UserController {
  ////

  users = (_req: Request, res: Response) => {
    let db
    try {
      db = connectUsers()
    } catch (error) {
      return res.status(500).json('error connect db')
    }
    const row = db.prepare('SELECT * FROM users').all() as Array<{
      id: string
      name: string
      status: number
    }>
    console.log(row)
    return res.status(200).json(row)
  }

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
    const db = connectUsers()
    const user = db.prepare('SELECT * FROM users WHERE name = ?;').get(name)
    if (user) {
      socket.emit('server:errorlogin')
      return
    }
    //insert new user
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
      socket.handshake.auth.username = name
      socket.emit('server:loginok')
      UserController.emitUsersEveryone({ io })
    } catch (error) {
      console.log(error)
    }
  }

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
    const db = connectUsers()
    const user = db
      .prepare('SELECT * FROM users WHERE name = ? AND status = ?')
      .get(name, 0) as {
      id: string
      name: string
      status: number
    }
    if (user) {
      try {
        db.prepare(
          'UPDATE users SET status = ?, updatedAt = ? WHERE id = ?'
        ).get(1, new Date().toISOString(), user.id)
        socket.emit('server:vfloginok')
        UserController.emitUsersEveryone({ io })
      } catch (error) {
        console.log(error)
      }
    } else socket.emit('server:errorvflogin')
  }

  //// A L L  U S E R S

  static emitUsersEveryone = ({ io }: { io: Server }) => {
    const db = connectUsers()
    const allUsers = db
      .prepare('SELECT * FROM users WHERE status = 1')
      .all() as Array<{
      id: string
      name: string
      status: number
    }>
    console.log('get all users')
    io.emit('server:users', allUsers)
  }

  static logoutEmitUsers = ({ socket }: { socket: Socket }) => {
    const db = connectUsers()
    const allUsers = db
      .prepare('SELECT * FROM users WHERE status = 1')
      .all() as Array<{
      id: string
      name: string
      status: number
    }>
    console.log('emit all users')
    socket.broadcast.emit('server:users', allUsers)
  }

  static dissEmitUsers = ({ socket }: { socket: Socket }) => {
    setTimeout(() => {
      const db = connectUsers()
      const user = db
        .prepare('SELECT * FROM users WHERE name = ?')
        .get(socket.handshake.auth.username) as { status: number }

      if (user && user.status === 0) {
        const allUsers = db
          .prepare('SELECT * FROM users WHERE status = 1')
          .all() as Array<{
          id: string
          name: string
          status: number
        }>
        console.log(
          '/dissEmitUsers: ',
          socket.id + ' ' + socket.handshake.auth.username
        )
        socket.broadcast.emit('server:users', allUsers)
      } else console.log('does not close in db')
    }, 2000)
  }

  //

  static logout = ({ socket }: { socket: Socket }) => {
    console.log('/logout: ', socket.handshake.auth.username)
    const db = connectUsers()
    try {
      db.prepare(
        'UPDATE users SET status = ?, updatedAt = ? WHERE name = ?'
      ).get(0, new Date().toISOString(), socket.handshake.auth.username)
    } catch (error) {
      console.log(error)
    }
  }

  static logoutAll = () => {
    const db = connectUsers()
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

  //
}
