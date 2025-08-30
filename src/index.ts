import express, { json } from 'express'
import { createServer } from 'node:http'
import { createUserRouter } from './routes/user.route'
import { createIo } from './routes/io.route'
import 'dotenv/config'

const port = process.env.PORT ?? 3000
const app = express()
app.use(json())

const httpServer = createServer(app)
createIo(httpServer)

app.get('/', (_req, res) => {
  res.sendFile(process.cwd() + '/client/client.html')
})

app.use('/', createUserRouter())

httpServer.listen(port, () => {
  console.log(`listening on http://localhost:${port}`)
})
