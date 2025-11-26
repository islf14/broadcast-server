import { UserController } from './user.controller.js'
// import { ChatModel } from '../models/chat.model.js'
import { ChatModel } from '../models/turso/chat.model.js'
import type { ChatDB } from '../types.js'

export class ChatController {
  //
  // Used in io - user:login

  static newChat = async (): Promise<string | undefined> => {
    const countUsers = await UserController.countAllUsers()
    let chatId: string | undefined
    if (countUsers === 1) {
      try {
        chatId = await ChatModel.create()
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        // delete user on error new chat
        await UserController.deleteAll()
        throw new Error('can not create chat: ' + m)
      }
    }
    return chatId
  }

  // UserController - closeChat

  static closeChat = (): Promise<boolean> => {
    return ChatModel.updateStatusByStatus({ status: 1, nStatus: 0 })
  }

  //
  // used at beginning of io.route

  static activeChat = (): Promise<ChatDB> => {
    return ChatModel.findByStatus({ status: 1 })
  }

  //
}
