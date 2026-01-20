export interface UserPublic {
  id: number
  username: string
  is_guest: boolean
}

export interface UsersPublic {
  count: number
  users: UserPublic[]
}

export interface MessagePublic {
  channel_id: number
  sender_username: string
  timestamp: string
  content: string
}

export interface MessagesPublic {
  count: number
  messages: MessagePublic[]
}

export interface UserUpdate {
  username?: string
  password?: string
}
