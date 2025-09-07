import { Server, Socket } from 'socket.io'
import { MessageModel } from '../models/message.model'

export class MessageController {
  //

  static create = ({
    io,
    socket,
    msg,
    idChat
  }: {
    io: Server
    socket: Socket
    msg: string
    idChat: string
  }) => {
    let newMessage
    try {
      newMessage = MessageModel.create({
        message: msg,
        username: socket.handshake.auth.username,
        idChat
      })

      if (newMessage) {
        io.emit('server:message', newMessage)
      }
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not create new message:' + m)
    }
  }

  //

  static loadMessages = ({
    socket,
    idChat
  }: {
    socket: Socket
    idChat: string
  }) => {
    const messages = MessageModel.messagesByChatOrder({
      id: idChat,
      ord: socket.handshake.auth.countMessages
    })
    socket.emit('server:login_messages', messages)
  }

  //
}
