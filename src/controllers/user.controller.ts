import { Request, Response } from 'express'
import { Socket } from 'socket.io'
import { ChatController } from './chat.controller'
import { UserModel } from '../models/user.model'

export class UserController {
  ////

  users = (_req: Request, res: Response) => {
    const row = UserModel.allUsers()
    console.log(row)
    return res.status(200).json(row)
  }

  //
  //

  static login = ({
    socket,
    name
  }: {
    socket: Socket
    name: string
  }): string => {
    console.log('/login name:', name)

    const exist = UserModel.findByName({ name })
    if (exist) {
      socket.emit('server:login_error')
      throw new Error('User already exists')
    }

    // New User
    let user
    try {
      user = UserModel.create({ name })
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      socket.emit('server:login_error')
      throw new Error(message)
    }

    // New Chat
    const allUsers = UserModel.allUsers()
    let idChat: string = ''
    if (allUsers.length === 1) {
      try {
        idChat = ChatController.create()
        console.log('chat created')
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        // delete user on error new chat
        UserModel.delete({ id: allUsers[0].id })
        socket.emit('server:login_error')
        throw new Error('can not create chat: ' + message)
      }
    }

    // login ok
    socket.handshake.auth.username = name
    const activeUsers = UserModel.allActiveUsers()
    console.log('notify connect')
    socket.emit('server:login_active_users', activeUsers)
    socket.broadcast.emit('server:user_connected', user)
    return idChat
  }

  //
  //

  static vlogin = ({ socket, type }: { socket: Socket; type: number }) => {
    console.log('/vlogin name: ', socket.handshake.auth.username)

    const user = UserModel.findByNameStatus({
      name: socket.handshake.auth.username,
      status: 0
    })
    //verify that only exist
    if (user) {
      // verify login ok
      try {
        UserModel.updateStatus({ id: user.id, status: 1 })
        const allUsers = UserModel.allActiveUsers()
        socket.emit('server:vlogin_active_users', allUsers)
        if (type !== 1) {
          console.log('notify connect')
          socket.broadcast.emit('server:user_connected', user)
        }
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        console.log('Error: ', message)
        socket.emit('server:vlogin_error')
      }
    } else {
      socket.handshake.auth.username = null
      socket.emit('server:vlogin_error')
    }
  }

  //
  // A L L  U S E R S

  static disNotify = ({ socket }: { socket: Socket }): boolean => {
    //
    const user = UserModel.findByName({ name: socket.handshake.auth.username })
    const activeUsers = UserModel.allActiveUsers()

    // finish chat?
    if (activeUsers.length === 0) {
      try {
        ChatController.closeChat()
        UserController.deleteAll()
        console.log('Chat closed')
        return true
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        throw new Error('unable to close chat: ' + message)
      }
    } else {
      console.log('notify disconnection')
      socket.broadcast.emit('server:user_disconnected', user)
      return false
    }
  }

  //

  static disReaload = async ({
    socket
  }: {
    socket: Socket
  }): Promise<boolean> => {
    const status = await new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // verify status
        const user = UserModel.findByName({
          name: socket.handshake.auth.username
        })
        if (user && user.status === 0) {
          // Notify disconnection or close chat
          resolve(UserController.disNotify({ socket }))
        } else {
          console.log('...realoaded')
          resolve(false)
        }
      }, 1000)
    })
    return status
  }

  //

  static logout = ({ socket }: { socket: Socket }) => {
    console.log('/logout: ', socket.handshake.auth.username)

    try {
      UserModel.updateStatusByName({
        name: socket.handshake.auth.username,
        status: 0
      })
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error: ', message)
    }
  }

  //

  static logoutAll = () => {
    const activeUsers = UserModel.allActiveUsers()
    activeUsers.forEach((user) => {
      UserModel.updateStatus({ id: user.id, status: 0 })
    })
  }

  //

  static deleteAll = () => {
    UserModel.deleteAll()
  }

  //
}
