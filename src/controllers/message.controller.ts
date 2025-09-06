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
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      console.log('Error:', message)
    }
    if (newMessage) {
      const messagePrint = {
        message: newMessage.message,
        username: newMessage.username,
        order: newMessage.ord,
        date: newMessage.createdAt
      }
      // console.log(messagePrint)
      io.emit('server:message', messagePrint)
    }
  }

  //
}
