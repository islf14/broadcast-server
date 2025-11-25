// io

export interface ServerToClientEvents {
  // server to user, other , all : data
  'server_user:login_error': (msg: string) => void
  'server_user:rate_error': (msg: string) => void
  'server_user:active_users': (Array) => void
  'server_user:necessary_messages': (messages: Array) => void
  'server_other:user_connected': (user: object) => void
  'server_other:user_disconnected': (user: object) => void
  'server_everyone:message': (message: object) => void
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

// MessageController - loadMessages
// MessageModel - messagesOrder
export type Messages = {
  chatId: string
  ord: number
}
// MessageModel
export type MessageDB = {
  message: string
  username: string
  ord: number
  date: string
}

// USERS

export type UserDB = {
  id: string
  name: string
  status: number
}

export type Id = Pick<UserDB, 'id'>

// UserController - Login,Vlogin,userDisconnect,userAfterLogout
// UserModel - create
export type Name = Pick<UserDB, 'name'>

export type NaSt = Omit<UserDB, 'id'>

export type IdSt = Omit<UserDB, 'name'>

export type ShowUser = {
  name: string
  status: number
  date: string
}

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
