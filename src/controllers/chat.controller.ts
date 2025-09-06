import { ChatModel } from '../models/chat.model'
import { UserModel } from '../models/user.model'

export class ChatController {
  //

  static newChat = () => {
    const allUsers = UserModel.allUsers()
    let idChat: string = ''
    if (allUsers.length === 1) {
      try {
        idChat = ChatModel.create()
        console.log('chat created')
      } catch (e: unknown) {
        let message
        if (e instanceof Error) message = e.message
        // delete user on error new chat
        UserModel.delete({ id: allUsers[0].id })
        throw new Error('can not create chat: ' + message)
      }
    }

    return idChat
  }

  //

  static closeChat = () => {
    return ChatModel.updateStatusByStatus({ status: 1, newStatus: 0 })
  }

  //

  static activeChat = () => {
    return ChatModel.findByStatus({ status: 1 })
  }

  //
}
