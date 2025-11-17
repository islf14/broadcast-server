import { Server } from 'socket.io'
import { Server as httpServer } from 'node:http'
import { UserController } from '../controllers/user.controller.js'
import { MessageController } from '../controllers/message.controller.js'
import { ChatController } from '../controllers/chat.controller.js'
import {
  ClientToServerEvents,
  InterServerEvents,
  Name,
  ServerToClientEvents,
  SocketData,
  UserDB
} from '../types.js'

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
  let chatId: string = ''

  try {
    const chat = ChatController.activeChat()
    if (chat) {
      chatId = chat.id
    }
  } catch (e: unknown) {
    let m
    if (e instanceof Error) m = e.message
    console.log('Error: ', m)
  }

  io.on('connection', (socket) => {
    //
    // Login
    // The user send a new name to join the chat

    socket.on('user:login', (name) => {
      try {
        // The name is created if it does not exist
        const id_user = UserController.login({ name }) as string
        // Save name into socket
        socket.handshake.auth.username = name
        // Get the active users
        const activeUsers = UserController.getActiveUsers()
        // Send active users to the user
        socket.emit('server:login_active_users', activeUsers)
        // Create a chat ID if one does not exist
        const id_chat = ChatController.newChat()
        if (id_chat) {
          chatId = id_chat
        } else {
          // Get the user
          const user = UserController.getUser({ id: id_user })
          // Notify other users of the connection
          socket.broadcast.emit('server:user_connected', user)
          // Load messages from the current chat
          const messages = MessageController.loadMessages({
            chatId,
            ord: socket.handshake.auth.countMessages
          })
          // Send messages to the user
          socket.emit('server:login_messages', messages)
        }
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        // Notify error to the user
        socket.emit('server:login_error', 'Try again or with a different name')
        console.log('Error: ', m)
      }
    })

    // Verify login
    // The user reloads the page or reconnects

    socket.on('user:vflogin', () => {
      try {
        // Check if the user has a status of 0 and change to 1
        const id_user = UserController.vlogin({
          name: socket.handshake.auth.username
        })
        if (id_user) {
          // Get the active users
          const activeUsers = UserController.getActiveUsers()
          socket.emit('server:login_active_users', activeUsers)
          // Get the user
          const user = UserController.getUser({ id: id_user })
          // Notify other users of the connection
          socket.broadcast.emit('server:user_connected', user)
          // }
          const messages = MessageController.loadMessages({
            chatId,
            ord: socket.handshake.auth.countMessages
          })
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
    // The user enters the url, reloads the page or closes it

    socket.on('disconnect', async () => {
      if (socket.handshake.auth.username !== null && chatId !== '') {
        const name = socket.handshake.auth.username
        UserController.logout({ name })
        // waits a few seconds for the user to reconnect
        const userAfter = await UserController.userAfter({ name })
        // Check if the user is logged out
        if (userAfter && userAfter.status === 0) {
          // Notify if there are active user or close the chat
          notifyOrClose({ name })
        }
      }
    })

    // The user closes the session

    socket.on('user:logout', async () => {
      if (socket.handshake.auth.username !== null && chatId !== '') {
        const name = socket.handshake.auth.username
        UserController.logout({ name })
        socket.handshake.auth.username = null
        socket.handshake.auth.countMessages = 0
        notifyOrClose({ name })
        //
      }
    })

    // Notify disconnection or close chat
    async function notifyOrClose({ name }: Name) {
      let userNotify: UserDB | undefined
      try {
        // Get the user (if there are active users)
        userNotify = UserController.userDisconnect({ name })
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        console.log('Error uD: ', m)
      }

      if (userNotify) {
        // Notify other users of the disconnection
        socket.broadcast.emit('server:user_disconnected', userNotify)
      } else {
        // There are not active users
        // Check if the chat is going to close
        try {
          const chatClosed = await UserController.closeChat()
          if (chatClosed) {
            chatId = ''
          }
        } catch (e: unknown) {
          let m
          if (e instanceof Error) m = e.message
          console.log('Error: ', m)
        }
      }
    }

    //
    // The user sends a new message

    socket.on('user:message', (msg) => {
      if (socket.handshake.auth.username !== null) {
        try {
          const message = MessageController.create({
            message: msg,
            username: socket.handshake.auth.username,
            chatId
          })
          if (message) {
            // Send the message to all users
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
