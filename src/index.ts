import { createServer } from 'node:http'
import express, { json } from 'express'
import { join } from 'node:path'
import 'dotenv/config'
import { corsMiddleware } from './middlewares/cors.middleware.js'
import { userRouter } from './routes/user.route.js'
import { createIo } from './routes/io.route.js'
import { ecors } from './middlewares/eCors.middleware.js'
import { port } from './constants.js'
import helmet from 'helmet'
// import { csp } from './middlewares/csp.middleware.js'

const app = express()
app.use(corsMiddleware())
app.use(ecors())
// app.use(csp())
app.use(helmet())
app.use(json())
app.use(express.static(join(process.cwd(), 'client')))

const httpServer = createServer(app)
await createIo(httpServer)

app.use('/', userRouter())

httpServer.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
