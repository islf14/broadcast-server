import { Request, Response } from 'express'
import { ChatController } from './chat.controller.js'
import { UserModel } from '../models/user.model.js'
import { Name, UserDB } from '../types.js'

export class UserController {
  ////

  users = (_req: Request, res: Response) => {
    const row = UserModel.allUsers()
    return res.status(200).json(row)
  }

  //

  static login = ({ name }: Name): string => {
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

  // Return the user id if it exists

  static vlogin = ({ name }: Name): string | undefined => {
    const user = UserModel.findByNameStatus({
      name,
      status: 0
    })

    if (user) {
      try {
        // change status to active
        UserModel.updateStatus({ id: user.id, status: 1 })
        return user.id
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        throw new Error(m)
      }
    } else {
      return undefined
    }
  }

  // return active users

  static getActiveUsers(): Array<UserDB> {
    const activeUsers = UserModel.allActiveUsers()
    return activeUsers
  }

  // Return active users and the user

  static getUser = ({ id }: { id: string }): UserDB => {
    const user = UserModel.find({ id })
    return user
  }

  //
  // Return the user if there are users to notify

  static userDisconnect = ({ name }: Name): UserDB | undefined => {
    //
    const user = UserModel.findByName({ name })
    const activeUsers = UserModel.allActiveUsers()
    if (activeUsers.length !== 0) {
      return user
    }
    return undefined
  }

  // Close Chat if is necessary

  static closeChat = async (): Promise<boolean> => {
    const chatClosed = await new Promise<boolean>((resolve) => {
      setTimeout(() => {
        const activeUsers = UserModel.allActiveUsers()

        // finish chat?
        if (activeUsers.length === 0) {
          // 0 active users
          try {
            ChatController.closeChat()
            UserController.deleteAll()
            resolve(true)
          } catch (e: unknown) {
            let m
            if (e instanceof Error) m = e.message
            throw new Error('unable to close chat: ' + m)
          }
        } else resolve(false)
      }, 10000)
    })
    return chatClosed
  }

  // If the user reloads the page, try to prevent the notification

  static userAfter = async ({ name }: Name): Promise<UserDB | undefined> => {
    const userAfter = await new Promise<UserDB | undefined>((resolve) => {
      setTimeout(() => {
        // after 3 second
        const user = UserModel.findByName({ name })
        resolve(user)
      }, 3000)
    })
    return userAfter
  }

  // Changing status to inactive

  static logout = ({ name }: Name): void => {
    try {
      UserModel.updateStatusByName({ name, status: 0 })
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not logout: ' + m)
    }
  }

  //

  static logoutAll = (): void => {
    const activeUsers = UserModel.allActiveUsers()
    activeUsers.forEach((user) => {
      UserModel.updateStatus({ id: user.id, status: 0 })
    })
  }

  //

  static deleteAll = (): void => {
    UserModel.deleteAll()
  }

  //
}
