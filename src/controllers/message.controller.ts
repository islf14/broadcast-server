// import { MessageModel } from '../models/message.model.js'
import { MessageModel } from '../models/turso/message.model.js'
import type { MessageDB, Messages, NewMessage } from '../types.js'

export class MessageController {
  //
  // Used id io.route - user:message

  static create = ({
    message,
    username,
    chatId
  }: NewMessage): Promise<MessageDB> => {
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

  // Used in io.route - emitMessages

  static loadMessages = ({
    chatId,
    ord
  }: Messages): Promise<Array<MessageDB>> => {
    return MessageModel.messagesOrder({ chatId, ord })
  }

  //
}
