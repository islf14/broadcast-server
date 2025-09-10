import { Server } from 'socket.io'
import { Server as httpServer } from 'node:http'
import { UserController } from '../controllers/user.controller'
import { MessageController } from '../controllers/message.controller'
import { ChatController } from '../controllers/chat.controller'
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '../types'

export function createIo(httpServer: httpServer): Server {
  //
  // S O C K E T
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
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
        const notifyLogin = UserController.notifyLogin({ id: id_user })
        socket.emit('server:login_active_users', notifyLogin.activeUsers)
        socket.broadcast.emit('server:user_connected', notifyLogin.user)

        socket.handshake.auth.username = name
        if (id_chat !== '') {
          idChat = id_chat
        } else {
          const messages = MessageController.loadMessages({ socket, idChat })
          socket.emit('server:login_messages', messages)
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
          const notifyLogin = UserController.notifyLogin({ id: id_user })
          socket.emit('server:login_active_users', notifyLogin.activeUsers)
          if (type !== 1) {
            socket.broadcast.emit('server:user_connected', notifyLogin.user)
          }
          const messages = MessageController.loadMessages({ socket, idChat })
          socket.emit('server:login_messages', messages)
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
        UserController.logout({ name: socket.handshake.auth.username })
        try {
          const notify = await UserController.disReload({
            name: socket.handshake.auth.username
          })
          if (notify.endChat) {
            idChat = ''
          }
          if (Object.keys(notify.userNoti).length > 0) {
            socket.broadcast.emit('server:user_disconnected', notify.userNoti)
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
          UserController.logout({ name: socket.handshake.auth.username })
          const notify = UserController.disNotify({
            name: socket.handshake.auth.username
          })
          if (notify.endChat) {
            idChat = ''
          }
          if (Object.keys(notify.userNoti).length > 0) {
            socket.broadcast.emit('server:user_disconnected', notify.userNoti)
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
          const message = MessageController.create({
            username: socket.handshake.auth.username,
            msg,
            idChat
          })
          if (message) {
            io.emit('server:message', message)
          }
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
