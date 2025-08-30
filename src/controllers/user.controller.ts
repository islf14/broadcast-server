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

  login = (req: Request, res: Response) => {
    if (!req.body || !req.body.name) {
      return res.status(400).json({ error: 'Must enter a name' })
    }
    const { name } = req.body
    console.log('/login name:', name)

    const db = connectUsers()
    const user = db.prepare('SELECT * FROM users WHERE name = ?;').get(name)
    if (user) {
      return res.status(400).json({ message: 'try another name' })
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
    } catch (error) {
      console.log(error)
      return res.status(500).json('error in db')
    }
    return res.status(200).json({ message: 'user legued' })
  }

  ////

  vlogin = (req: Request, res: Response) => {
    if (!req.body || !req.body.name) {
      return res.status(400).json({ error: 'Must enter a name' })
    }
    const { name } = req.body
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
      } catch (error) {
        console.log(error)
        return res.status(500).json('error in db')
      }
      return res.status(200).json({ message: 'valid and available user' })
    } else
      return res.status(400).json({ message: 'user busy or does not exist' })
  }

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
    row.forEach((ro) => {
      console.log(`Name: ${ro.name}, status: ${ro.status}`)
    })
    return res.status(200).json(row)
  }

  ////

  static emitAllUsers = ({ socket }: { socket: Socket }) => {
    const db = connectUsers()
    const allUsers = db
      .prepare('SELECT * FROM users WHERE status = 1')
      .all() as Array<{
      id: string
      name: string
      status: number
    }>
    console.log('emit all users')
    socket.broadcast.emit('users', allUsers)
  }

  static getAllUsers = ({ io }: { io: Server }) => {
    const db = connectUsers()
    const allUsers = db
      .prepare('SELECT * FROM users WHERE status = 1')
      .all() as Array<{
      id: string
      name: string
      status: number
    }>
    console.log('get all users')
    io.emit('users', allUsers)
  }

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

  //

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
}
