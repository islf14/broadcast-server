import express, { json } from 'express'
import Database from 'libsql'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'

const port = process.env.PORT ?? 3000
const app = express()
app.use(json())
const httpServer = createServer(app)
const io = new Server(httpServer, {
  /* options */
})

app.get('/', (_req, res) => {
  res.sendFile(process.cwd() + '/client/client.html')
})

// connect db
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

// S O C K E T

io.on('connection', (socket) => {
  console.log('=> connection: ', socket.id)
  console.log(socket.handshake.auth)

  socket.on('disconnect', (reason) => {
    console.log('=> disconnect: ', reason)
    disconnectUser()
  })

  socket.on('logout', () => {
    disconnectUser()
  })

  socket.on('message', (msg) => {
    console.log(socket.handshake.auth)
    console.log('message from client: ', msg)
  })

  socket.on('login:updateuser', (name) => {
    socket.handshake.auth.username = name
  })

  function disconnectUser() {
    console.log(socket.handshake.auth)
    const db = connectUsers()
    try {
      db.prepare(
        'UPDATE users SET status = ?, updatedAt = ? WHERE name = ?'
      ).get(0, new Date().toISOString(), socket.handshake.auth.username)
    } catch (error) {
      console.log(error)
    }
  }
})

//////

app.post('/login', (req, res) => {
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
    ).get(uuidv4(), name, 1, new Date().toISOString(), new Date().toISOString())
  } catch (error) {
    console.log(error)
    return res.status(500).json('error in db')
  }

  //send all users actives
  const allUsers = db
    .prepare('SELECT * FROM users WHERE status = 1')
    .all() as Array<{
    id: string
    name: string
    status: number
  }>
  io.emit('list-users', allUsers)
  //
  return res.status(200).json({ message: 'user legued' })
})

//////

app.post('/vlogin', (req, res) => {
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
      db.prepare('UPDATE users SET status = ?, updatedAt = ? WHERE id = ?').get(
        1,
        new Date().toISOString(),
        user.id
      )
    } catch (error) {
      console.log(error)
      return res.status(500).json('error in db')
    }

    //send all users actives
    const allUsers = db
      .prepare('SELECT * FROM users WHERE status = 1')
      .all() as Array<{
      id: string
      name: string
      status: number
    }>
    io.emit('list-users', allUsers)
    //
    return res.status(200).json({ message: 'valid and available user' })
  } else return res.status(400).json({ message: 'user busy or does not exist' })
})

// create db and table
app.get('/users', (_req, res) => {
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
})

httpServer.listen(port, () => {
  console.log(`listening on http://localhost:${port}`)
})
