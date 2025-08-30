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
    //
    console.log(
      '=> connection: ',
      socket.id + ' ' + socket.handshake.auth.username
    )

    socket.on('disconnect', () => {
      if (socket.handshake.auth.username !== null) {
        console.log(
          'disconnect: ',
          socket.id + ' ' + socket.handshake.auth.username
        )
        UserController.logout({ socket })
        UserController.emitAllUsers({ socket })
      }
    })

    socket.on('user:logout', () => {
      console.log(
        'user:logout: ',
        socket.id + ' ' + socket.handshake.auth.username
      )
      if (socket.handshake.auth.username !== null) {
        UserController.logout({ socket })
        UserController.emitAllUsers({ socket })
        socket.handshake.auth.username = null
      }
    })

    socket.on('user:updatename', (name) => {
      socket.handshake.auth.username = name
    })

    socket.on('user:getall', () => UserController.getAllUsers({ io }))

    socket.on('message', (msg) => {
      console.log(socket.handshake.auth)
      console.log('message from client: ', msg)
      io.emit('return', 'holi return from message')
    })
    //
  })

  return io
}
