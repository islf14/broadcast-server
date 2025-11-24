import { Server } from 'socket.io'
import { Server as httpServer } from 'node:http'
import { UserController } from '../controllers/user.controller.js'
import { MessageController } from '../controllers/message.controller.js'
import { ChatController } from '../controllers/chat.controller.js'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import {
  ClientToServerEvents,
  InterServerEvents,
  Name,
  ServerToClientEvents,
  SocketData
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

  const chatName = 'currentChat'

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
    console.error(new Date().toLocaleString() + ' =>', m)
  }

  io.on('connection', (socket) => {
    //
    // Login
    // The user send a new name to join the chat

    const loginRateLimiter = new RateLimiterMemory({
      points: 2, // 2 messages
      duration: 20 // per 5 seconds
    })

    socket.on('user:login', (name) => {
      loginRateLimiter
        .consume(socket.handshake.address)
        .then(() => {
          try {
            // The name is created if it does not exist
            const id_user = UserController.login({ name }) as string
            socket.handshake.auth.username = name
            socket.join(chatName) // Add user to current chat
            emitActiveUsers() // Obtain active users and notify the user
            // Create a chat ID if one does not exist
            const id_chat = ChatController.newChat()
            if (id_chat) {
              chatId = id_chat
            } else {
              broadcastUser(id_user) // Notify other users of the connection
              emitMessages() // Send messages to the user
            }
          } catch (e: unknown) {
            let m
            if (e instanceof Error) m = e.message
            // Notify error to the user
            console.error(new Date().toLocaleString() + ' =>', m)
            socket.emit('server_user:login_error', 'Try again (other name)')
          }
        })
        .catch(() => {
          socket.emit('server_user:login_error', 'Too many logins')
        })
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
          socket.join(chatName) // Add user to current chat
          emitActiveUsers() // Obtain active users and notify the user
          broadcastUser(id_user) // Notify other users of the connection
          emitMessages() // Send messages to the user
        } else {
          socket.handshake.auth.username = null
          socket.emit('server_user:login_error', 'New chat, login again.')
        }
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        console.error(new Date().toLocaleString() + ' =>', m)
        socket.emit('server_user:login_error', 'Error, login again.')
      }
    })

    // Obtain active users and notify the user
    function emitActiveUsers() {
      // Get the active users
      const activeUsers = UserController.getActiveUsers()
      // Send active users to the user
      socket.emit('server_user:active_users', activeUsers)
    }

    // Get the user and notify other users of the connection
    function broadcastUser(id_user: string) {
      // Get the user
      const userName = UserController.getUser({ id: id_user })
      const user = { name: userName.name }
      // Notify other users of the connection // broadcast
      socket.to(chatName).emit('server_other:user_connected', user)
    }

    // Load messages from the current chat and notify the user
    function emitMessages() {
      // Load messages from the current chat
      const messages = MessageController.loadMessages({
        chatId,
        ord: socket.handshake.auth.countMessages
      })
      // Send messages to the user
      socket.emit('server_user:necessary_messages', messages)
    }

    // Reset socket because the user deleted data from local storage
    // (e.g. when the  server stopped)
    // clean so that the new user receives all messages.
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
        socket.leave(chatName)
        notifyOrClose({ name })
        //
      }
    })

    // Notify disconnection or close chat
    async function notifyOrClose({ name }: Name) {
      let notify: boolean = false
      try {
        // Get the user (if there are active users)
        notify = UserController.notifyDisconnection()
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        console.error(new Date().toLocaleString() + ' =>', m)
      }

      if (notify) {
        // Notify other users of the disconnection // broadcast
        socket.to(chatName).emit('server_other:user_disconnected', { name })
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
          console.error(new Date().toLocaleString() + ' =>', m)
        }
      }
    }

    //
    // The user sends a new message
    const messageRateLimiter = new RateLimiterMemory({
      points: 10, // 4 messages
      duration: 5 // per 2 seconds
    })

    socket.on('user:message', (msg) => {
      messageRateLimiter
        .consume(socket.handshake.address)
        .then(() => {
          if (socket.handshake.auth.username !== null) {
            try {
              const message = MessageController.create({
                message: msg,
                username: socket.handshake.auth.username,
                chatId
              })
              if (message) {
                // Send the message to all users
                io.to(chatName).emit('server_everyone:message', message)
              }
            } catch (e: unknown) {
              let m
              if (e instanceof Error) m = e.message
              console.error(new Date().toLocaleString() + ' =>', m)
            }
          }
        })
        .catch(() => {
          socket.emit('server_user:rate_error', 'Too many messages')
        })
    })

    //
  })

  return io
}
