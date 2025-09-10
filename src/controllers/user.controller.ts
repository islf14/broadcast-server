import { Request, Response } from 'express'
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

  static notifyLogin = ({ id }: { id: string }) => {
    const activeUsers = UserModel.allActiveUsers()
    const user = UserModel.find({ id })
    return { activeUsers, user }
  }

  //

  static disNotify = ({
    name
  }: {
    name: string
  }): { endChat: boolean; userNoti: object } => {
    //
    const user = UserModel.findByName({ name })
    const activeUsers = UserModel.allActiveUsers()

    let notify: { endChat: boolean; userNoti: object } = {
      endChat: false,
      userNoti: {}
    }
    // finish chat?
    if (activeUsers.length === 0) {
      // 0 active users
      try {
        ChatController.closeChat()
        UserController.deleteAll()
        notify.endChat = true
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        throw new Error('unable to close chat: ' + m)
      }
    } else {
      // There are active users
      notify.endChat = false
      notify.userNoti = user
    }
    return notify
  }

  //

  static disReload = async ({
    name
  }: {
    name: string
  }): Promise<{ endChat: boolean; userNoti: object }> => {
    const status = await new Promise<{ endChat: boolean; userNoti: object }>(
      (resolve) => {
        setTimeout(() => {
          const user = UserModel.findByName({ name })

          let notify: { endChat: boolean; userNoti: object } = {
            endChat: false,
            userNoti: {}
          }
          // verify status
          if (user && user.status === 0) {
            // Notify disconnection or close chat
            const noti = UserController.disNotify({ name })
            notify.endChat = noti.endChat
            notify.userNoti = noti.userNoti
          }
          resolve(notify)
        }, 1000)
      }
    )
    return status
  }

  //

  static logout = ({ name }: { name: string }) => {
    try {
      UserModel.updateStatusByName({ name, status: 0 })
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
