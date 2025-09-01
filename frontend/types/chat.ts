export interface Chat {
  id: string
  task_id?: string // Optional for direct bookings
  customer_id: string
  tasker_id: string
  created_at: string
  updated_at: string
  last_message_at: string
  task?: TaskInfo
  customer_profile?: UserProfile
  tasker_profile?: UserProfile
  last_message?: ChatMessage
  unread_count?: number
  is_active?: boolean // Whether the chat is still active (task not completed/cancelled)
  chat_type?: 'task' | 'direct_booking' // Type of chat
}

export interface ChatMessage {
  id: string
  chat_id: string
  sender_id: string
  message: string
  message_type: 'text' | 'image' | 'file' | 'system'
  file_url?: string
  file_name?: string
  file_size?: number
  read_at?: string
  created_at: string
  sender_profile?: UserProfile
}

export interface TaskInfo {
  id: string
  title: string
  status: string
  budget: number
  completed_at?: string
  cancelled_at?: string
}

export interface UserProfile {
  id: string
  full_name: string
  username: string
  avatar_url?: string
}

export interface ChatParticipant {
  id: string
  chat_id: string
  user_id: string
  joined_at: string
  left_at?: string
  user_profile?: UserProfile
}

export interface CreateChatRequest {
  task_id?: string // Optional for direct bookings
  customer_id: string
  tasker_id: string
}

export interface SendMessageRequest {
  chat_id: string
  message: string
  message_type?: 'text' | 'image' | 'file' | 'system'
  file_url?: string
  file_name?: string
  file_size?: number
}

export interface ChatFilters {
  search?: string
  unread_only?: boolean
  sort_by?: 'last_message' | 'created_at'
  sort_order?: 'asc' | 'desc'
  active_only?: boolean // Only show chats for active tasks
}

// New interface for real-time chat updates
export interface ChatUpdate {
  type: 'message' | 'status' | 'read'
  chat_id: string
  data: any
  timestamp: string
}

// Chat validation result
export interface ChatValidationResult {
  can_chat: boolean
  reason?: string
  task_status?: string
}
