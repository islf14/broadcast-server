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
      let m
      if (e instanceof Error) m = e.message
      console.log('Error:', m)
    }
    if (newMessage) {
      const messagePrint = {
        message: newMessage.message,
        username: newMessage.username,
        order: newMessage.ord,
        date: newMessage.createdAt
      }
      io.emit('server:message', messagePrint)
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
    const messages = MessageModel.messagesByChat({ id: idChat })
    console.log('load messages')
    socket.emit('server:login_messages', messages)
  }

  //
}
