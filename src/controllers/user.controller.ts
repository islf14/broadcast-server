import { Request, Response } from 'express'
import { Socket } from 'socket.io'
import { ChatController } from './chat.controller'
import { UserModel } from '../models/user.model'

export class UserController {
  ////

  users = (_req: Request, res: Response) => {
    const row = UserModel.allUsers()
    return res.status(200).json(row)
  }

  //

  static login = ({ name }: { name: string }) => {
    const exist = UserModel.findByName({ name })
    if (exist) {
      throw new Error('User already exists')
    }

    try {
      return UserModel.create({ name })
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error(m)
    }
  }

  //

  static vlogin = ({ name }: { name: string }) => {
    const user = UserModel.findByNameStatus({
      name,
      status: 0
    })

    if (user) {
      try {
        UserModel.updateStatus({ id: user.id, status: 1 })
        return user.id
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        throw new Error(m)
      }
    } else {
      return user
    }
  }

  //

  static notifyLogin = ({
    socket,
    id,
    type
  }: {
    socket: Socket
    id: string
    type: number
  }) => {
    const activeUsers = UserModel.allActiveUsers()
    const user = UserModel.find({ id })
    socket.emit('server:login_active_users', activeUsers)
    if (type !== 1) {
      socket.broadcast.emit('server:user_connected', user)
    }
  }

  //

  static disNotify = ({ socket }: { socket: Socket }): boolean => {
    //
    const user = UserModel.findByName({ name: socket.handshake.auth.username })
    const activeUsers = UserModel.allActiveUsers()

    // finish chat?
    if (activeUsers.length === 0) {
      try {
        ChatController.closeChat()
        UserController.deleteAll()
        return true
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        throw new Error('unable to close chat: ' + m)
      }
    } else {
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
          resolve(false)
        }
      }, 1000)
    })
    return status
  }

  //

  static logout = ({ socket }: { socket: Socket }) => {
    try {
      UserModel.updateStatusByName({
        name: socket.handshake.auth.username,
        status: 0
      })
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not logout: ' + m)
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
