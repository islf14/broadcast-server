import { ChatModel } from '../models/chat.model'

export class ChatController {
  //

  static create = () => {
    return ChatModel.create()
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
