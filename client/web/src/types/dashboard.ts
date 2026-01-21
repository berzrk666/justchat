export interface UserPublic {
  id: number
  username: string
  is_guest: boolean
  created_at: string
}

export interface UsersPublic {
  total_users: number
  total_pages: number
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

export interface Channel {
  id: number
}

export interface ChannelsStats {
  count: number
  channels: Channel[]
}

export interface ChannelMember {
  id: number
  username: string
  is_guest: boolean
}

export interface ChannelMembers {
  count: number
  users: ChannelMember[]
}
