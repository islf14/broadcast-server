import { Server } from 'socket.io'
import { Server as httpServer } from 'node:http'
import { UserController } from '../controllers/user.controller'

export function createIo(httpServer: httpServer): Server {
  // S O C K E T
  const io = new Server(httpServer, {
    /* options */
  })

  console.log('::: Creating io...')
  UserController.logoutAll()

  io.on('connection', (socket) => {
    console.log(
      '=> connection: ',
      socket.id + ' ' + socket.handshake.auth.username
    )

    socket.on('disconnect', () => UserController.logout({ socket }))

    socket.on('logout', () => UserController.logout({ socket }))

    socket.on('message', (msg) => {
      console.log(socket.handshake.auth)
      console.log('message from client: ', msg)
      io.emit('return', 'holi return from message')
    })

    socket.on('login:updateuser', (name) => {
      socket.handshake.auth.username = name
    })
  })

  return io
}
