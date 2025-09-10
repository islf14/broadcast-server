export interface ServerToClientEvents {
  'server:login_error': (msg: string) => void
  'server:login_active_users': (Array) => void
  'server:user_connected': (user: object) => void
  'server:message': (message: object) => void
  'server:login_messages': (messages: Array) => void
  'server:user_disconnected': (user: object) => void
}

export interface ClientToServerEvents {
  'user:vflogin': (type: number) => void
  'user:login': (name: string) => void
  'user:message': (msg: string) => void
  'user:clean': () => void
  'user:logout': () => void
}

export interface InterServerEvents {}
export interface SocketData {}

export type UpdateChat = {
  status: number
  newStatus: number
}

export type StatusChat = Pick<stChat, 'status'>

export type NewMessage = {
  message: string
  username: string
  idChat: string
}

export type Messages = {
  id: string
  ord: number
}

export type MessageDB = {
  message: string
  username: string
  ord: number
  chat_id: string
  date: string
}

export type UserDB = {
  id: string
  name: string
  status: number
}

export type Id = Pick<UserDB, 'id'>

export type Name = Pick<UserDB, 'name'>

export type NaSt = Omit<UserDB, 'id'>

export type IdSt = Omit<UserDB, 'name'>
