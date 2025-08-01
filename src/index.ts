import express, { json } from 'express'
import Database from 'libsql'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import 'dotenv/config'

const port = process.env.PORT ?? 3000
const app = express()
app.use(json())
const httpServer = createServer(app)
const io = new Server(httpServer, {
  /* options */
})

io.on('connection', (socket) => {
  console.log(socket.id)
})

app.get('/', (_req, res) => {
  res.sendFile(process.cwd() + '/client/client.html')
})

app.get('/users', (_req, res) => {
  const db = new Database('./data.db')
  try {
    const tb = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users';"
      )
      .get()
    console.log(tb)
    if (tb === undefined) {
      db.exec(
        'CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)'
      )
    }
  } catch (error) {
    return res.status(500).json('error connect db')
  }

  db.exec(
    "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.org')"
  )
  // const row = db.prepare('SELECT * FROM users WHERE id > ?;').get(1) as {
  //   id: number
  //   name: string
  //   email: string
  // }
  // if (row) {
  //   console.log(`Name: ${row.name}, email: ${row.email}`)
  // }
  const row = db.prepare('SELECT * FROM users').all() as Array<{
    id: number
    name: string
    email: string
  }>
  console.log(row)
  row.forEach((ro) => {
    console.log(`Name: ${ro.name}, email: ${ro.email}`)
  })
  return res.status(200).json(row)
})

httpServer.listen(port, () => {
  console.log(`listening on http://localhost:${port}`)
})
