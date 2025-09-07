import { Server } from 'socket.io'
import { Server as httpServer } from 'node:http'
import { UserController } from '../controllers/user.controller'
import { MessageController } from '../controllers/message.controller'
import { ChatController } from '../controllers/chat.controller'

export function createIo(httpServer: httpServer): Server {
  //
  // S O C K E T
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
    let m
    if (e instanceof Error) m = e.message
    console.log('Error: ', m)
  }

  io.on('connection', (socket) => {
    //
    //login

    socket.on('user:login', (name) => {
      try {
        const id_user = UserController.login({ name }) as string
        const id_chat = ChatController.newChat()
        // type 1 = reload
        UserController.notifyLogin({ socket, id: id_user, type: 0 })
        socket.handshake.auth.username = name
        if (id_chat !== '') {
          idChat = id_chat
        } else {
          MessageController.loadMessages({ socket, idChat })
        }
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        socket.emit('server:login_error', 'Try again or another name')
        console.log('Error: ', m)
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
          MessageController.loadMessages({ socket, idChat })
        } else {
          socket.handshake.auth.username = null
          socket.emit('server:login_error', 'New chat, login again.')
        }
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        console.log('Error: ', m)
        socket.emit('server:login_error', 'Error, login again.')
      }
    })

    //

    socket.on('user:clean', () => {
      socket.handshake.auth.username = null
      socket.handshake.auth.countMessages = 0
    })

    //

    socket.on('disconnect', async () => {
      if (socket.handshake.auth.username !== null && idChat !== '') {
        UserController.logout({ socket })
        try {
          const endChat = await UserController.disReaload({ socket })
          if (endChat) {
            idChat = ''
          }
        } catch (e: unknown) {
          let m
          if (e instanceof Error) m = e.message
          console.log('Error: ', m)
        }
      }
    })

    //

    socket.on('user:logout', () => {
      if (socket.handshake.auth.username !== null && idChat !== '') {
        try {
          UserController.logout({ socket })
          const endChat = UserController.disNotify({ socket })
          if (endChat) {
            idChat = ''
          }
          socket.handshake.auth.username = null
          socket.handshake.auth.countMessages = 0
        } catch (e: unknown) {
          let m
          if (e instanceof Error) m = e.message
          console.log('Error: ', m)
        }
      }
    })

    //

    socket.on('user:message', (msg) => {
      if (socket.handshake.auth.username !== null) {
        try {
          MessageController.create({ io, socket, msg, idChat })
        } catch (e: unknown) {
          let m
          if (e instanceof Error) m = e.message
          console.log('Error: ', m)
        }
      }
    })

    //
  })

  return io
}
