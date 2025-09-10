import { MessageModel } from '../models/message.model.js'

export class MessageController {
  //

  static create = ({
    username,
    msg,
    idChat
  }: {
    username: string
    msg: string
    idChat: string
  }) => {
    try {
      return MessageModel.create({
        message: msg,
        username,
        idChat
      })
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not create new message:' + m)
    }
  }

  //

  static loadMessages = ({
    idChat,
    count
  }: {
    idChat: string
    count: number
  }) => {
    return MessageModel.messagesByChatOrder({
      id: idChat,
      ord: count
    })
  }

  //
}
