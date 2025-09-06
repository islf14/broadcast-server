import { Server } from 'socket.io'
import { Server as httpServer } from 'node:http'
import { UserController } from '../controllers/user.controller'
import { MessageController } from '../controllers/message.controller'
import { ChatController } from '../controllers/chat.controller'

export function createIo(httpServer: httpServer): Server {
  //
  // S O C K E T
  console.log('::: Creating io...')
  const io = new Server(httpServer, {
    /* options */
  })

  UserController.logoutAll()
  let idChat: string = ''

  try {
    const chat = ChatController.activeChat()
    if (chat) {
      idChat = chat.id
    }
  } catch (e: unknown) {
    let message
    if (e instanceof Error) message = e.message
    console.log('Error: ', message)
  }

  io.on('connection', (socket) => {
    //
    console.log(
      '=> connection: ',
      socket.id + ' ' + socket.handshake.auth.username
    )

    //login

    socket.on('user:login', (name) => {
      try {
        const id_user = UserController.login({ name }) as string
        const id_chat = ChatController.newChat()
        if (id_chat !== '') idChat = id_chat
        socket.handshake.auth.username = name
        // type 1 = reload
        UserController.notifyLogin({ socket, id: id_user, type: 0 })
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        socket.emit('server:login_error')
        console.log('Error: ', message)
      }
    })

    // verify login

    socket.on('user:vflogin', (type) => {
      try {
        const id_user = UserController.vlogin({
          name: socket.handshake.auth.username
        })
        if (id_user) {
          UserController.notifyLogin({ socket, id: id_user, type })
        } else {
          socket.handshake.auth.username = null
          socket.emit('server:vlogin_error')
        }
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        console.log('Error: ', message)
        socket.emit('server:vlogin_error')
      }
    })

    //

    socket.on('user:clean', () => {
      socket.handshake.auth.username = null
      console.log('clean: ', socket.id + ' ' + socket.handshake.auth.username)
    })

    //

    socket.on('disconnect', async () => {
      console.log(
        '=> disconnect: ',
        socket.id + ' ' + socket.handshake.auth.username
      )
      if (socket.handshake.auth.username !== null && idChat !== '') {
        UserController.logout({ socket })
        try {
          const endChat = await UserController.disReaload({ socket })
          if (endChat) {
            idChat = ''
          }
        } catch (e: unknown) {
          let message
          if (e instanceof Error) message = e.message
          console.log('Error: ', message)
        }
      }
    })

    //

    socket.on('user:logout', () => {
      console.log(
        '=> user:logout: ',
        socket.id + ' ' + socket.handshake.auth.username
      )

      if (socket.handshake.auth.username !== null && idChat !== '') {
        UserController.logout({ socket })
        try {
          const endChat = UserController.disNotify({ socket })
          if (endChat) {
            idChat = ''
          }
        } catch (e: unknown) {
          let message
          if (e instanceof Error) message = e.message
          console.log('Error: ', message)
        }
        socket.handshake.auth.username = null
      }
    })

    //

    socket.on('user:message', (msg) => {
      if (socket.handshake.auth.username !== null) {
        console.log(socket.handshake.auth)
        MessageController.create({ io, socket, msg, idChat })
      }
    })

    //
  })

  return io
}
