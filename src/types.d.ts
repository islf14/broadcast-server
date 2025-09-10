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

export interface Auth {
  username: string
}
