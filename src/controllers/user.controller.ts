import { Request, Response } from 'express'
import { ChatController } from './chat.controller.js'
// import { UserModel } from '../models/user.model.js'
import { UserModel } from '../models/turso/user.model.js'
import { Id, Name, UserDB } from '../types.js'

export class UserController {
  ////
  // Used in user.route
  users = async (_req: Request, res: Response) => {
    const row = await UserModel.allUsers()
    return res.status(200).json(row)
  }

  // Used in ChatController - newChat

  static countAllUsers = (): Promise<number> => {
    return UserModel.countAllUsers()
  }

  // Used in io.route - user:login

  static login = async ({ name }: Name): Promise<string> => {
    const count = await UserModel.countUsersByName({ name })
    if (count !== 0) {
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
  // Check if the user is offline and try switching to online mode
  static vlogin = async ({ name }: Name): Promise<string | undefined> => {
    const values = { name, status: 0 }
    const user = await UserModel.findByNameStatus(values)
    if (user) {
      return await UserController.changeToOnline(user.id)
    } else {
      const user2 = await new Promise<UserDB | undefined>((resolve) => {
        setTimeout(async () => {
          resolve(await UserModel.findByNameStatus(values))
        }, 600)
      })
      if (user2) {
        return await UserController.changeToOnline(user2.id)
      } else {
        return undefined
      }
    }
  }
  // change status to active
  // vlogin (above)
  static async changeToOnline(id: string): Promise<string> {
    try {
      await UserModel.updateStatus({ id, status: 1 })
      return id
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error(m)
    }
  }

  // return active users
  // Used in io.route - emitActiveUsers

  static getActiveUsers(): Promise<Array<Name>> {
    return UserModel.nameActiveUsers()
  }

  // Return active users and the user
  // Used in io.route - broadcastUser

  static getUser = ({ id }: Id): Promise<Name> => {
    return UserModel.find({ id })
  }

  // Return the user if there are users to notify
  // Used in io.route - notifyOrClose

  static notifyDisconnection = async (): Promise<boolean> => {
    const countActiveUsers = await UserModel.countAciveUsers()
    if (countActiveUsers !== 0) {
      return true
    }
    return false
  }

  // Close Chat if is necessary

  static closeChat = async (): Promise<boolean> => {
    const chatClosed = await new Promise<boolean>((resolve) => {
      setTimeout(async () => {
        const countActiveUsers = await UserModel.countAciveUsers()

        // finish chat?
        if (countActiveUsers === 0) {
          // 0 active users
          try {
            await ChatController.closeChat()
            await UserController.deleteAll()
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
  // Used in io.route - disconnect

  static userAfter = async ({ name }: Name): Promise<UserDB | undefined> => {
    const userAfter = await new Promise<UserDB | undefined>((resolve) => {
      setTimeout(async () => {
        // after 3 second
        const user = await UserModel.findByName({ name })
        resolve(user)
      }, 3000)
    })
    return userAfter
  }

  // Changing status to inactive

  static logout = async ({ name }: Name): Promise<void> => {
    try {
      await UserModel.updateStatusByName({ name, status: 0 })
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not logout: ' + m)
    }
  }

  // Used in io

  static logoutAll = async (): Promise<void> => {
    const activeUsers = await UserModel.allActiveUsers()
    activeUsers.forEach((user) => {
      UserModel.updateStatus({ id: user.id, status: 0 })
    })
  }

  // Used in UserController - closeChat
  // Used in ChatController - newChat

  static deleteAll = async (): Promise<void> => {
    await UserModel.deleteAll()
  }

  //
}
