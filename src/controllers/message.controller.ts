import { MessageModel } from '../models/message.model.js'
import { MessageDB, Messages, NewMessage } from '../types.js'

export class MessageController {
  //

  static create = ({ message, username, chatId }: NewMessage): MessageDB => {
    try {
      return MessageModel.create({
        message,
        username,
        chatId
      })
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not create new message:' + m)
    }
  }

  //

  static loadMessages = ({ chatId, ord }: Messages): Array<MessageDB> => {
    return MessageModel.messagesByChatOrder({
      chatId,
      ord
    })
  }

  //
}
