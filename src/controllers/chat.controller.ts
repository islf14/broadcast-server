import { ChatModel } from '../models/chat.model.js'
import { UserModel } from '../models/user.model.js'
import { ChatDB } from '../types.js'

export class ChatController {
  //

  static newChat = (): string | undefined => {
    const allUsers = UserModel.allUsers()
    let chatId: string | undefined
    if (allUsers.length === 1) {
      try {
        chatId = ChatModel.create()
      } catch (e: unknown) {
        let m
        if (e instanceof Error) m = e.message
        // delete user on error new chat
        UserModel.delete({ id: allUsers[0].id })
        throw new Error('can not create chat: ' + m)
      }
    }
    return chatId
  }

  // UserController - closeChat

  static closeChat = (): boolean => {
    return ChatModel.updateStatusByStatus({ status: 1, nStatus: 0 })
  }

  //
  // used at beginning of io.route

  static activeChat = (): ChatDB => {
    return ChatModel.findByStatus({ status: 1 })
  }

  //
}
