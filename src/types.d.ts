// io

export interface ServerToClientEvents {
  'server:login_error': (msg: string) => void
  'server:login_active_users': (Array) => void
  'server:user_connected': (user: object) => void
  'server:message': (message: object) => void
  'server:login_messages': (messages: Array) => void
  'server:user_disconnected': (user: object) => void
}

export interface ClientToServerEvents {
  'user:vflogin': () => void
  'user:login': (name: string) => void
  'user:message': (msg: string) => void
  'user:clean': () => void
  'user:logout': () => void
}

export interface InterServerEvents {}
export interface SocketData {}

// MESSAGES

// MessageModel - create
export type NewMessage = {
  message: string
  username: string
  chatId: string
}

export type Messages = {
  chatId: string
  ord: number
}

export type MessageDB = {
  message: string
  username: string
  ord: number
  chatId: string
  date: string
}

// USERS

export type UserDB = {
  id: string
  name: string
  status: number
}

export type Id = Pick<UserDB, 'id'>

export type Name = Pick<UserDB, 'name'>

export type NaSt = Omit<UserDB, 'id'>

export type IdSt = Omit<UserDB, 'name'>

// CHATS

export type ChatDB = {
  id: string
  status: number
}

export type StatusChat = Pick<ChatDB, 'status'>

export type UpdChat = {
  status: number
  nStatus: number
}

// for cors

export type StaticOrigin =
  | boolean
  | string
  | RegExp
  | Array<boolean | string | RegExp>

// Rate limit

export type Rate = {
  times: number
  minutes: number
}

// UserController
/// Login,Vlogin,Logout
export type Name = { name: string }

/// disNotify, disReload
export type EndChatUser = {
  endChat: boolean
  userNoti: object
}
