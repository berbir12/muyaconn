import { supabase } from '../lib/supabase'

export interface ChatMessage {
  id: string
  task_id: string
  sender_id: string
  message: string
  created_at: string
  updated_at: string
  // Additional fields for display
  sender_name?: string
  sender_avatar?: string
}

export interface Chat {
  id: string
  task_id: string
  customer_id: string
  tasker_id: string
  created_at: string
  updated_at: string
  // Additional fields for display
  task_title?: string
  customer_name?: string
  tasker_name?: string
  last_message?: string
  last_message_time?: string
  unread_count?: number
}

export class ChatService {
  // Get all chats for a user
  static async getUserChats(userId: string): Promise<Chat[]> {
    try {
      // Get tasks where user is either customer or tasker
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          customer_id,
          tasker_id,
          profiles!tasks_customer_id_fkey(full_name),
          profiles!tasks_tasker_id_fkey(full_name)
        `)
        .or(`customer_id.eq.${userId},tasker_id.eq.${userId}`)
        .not('tasker_id', 'is', null) // Only tasks with assigned taskers

      if (tasksError) throw tasksError

      // Get latest message for each task
      const chats: Chat[] = []
      
      for (const task of tasks || []) {
        if (!task.tasker_id) continue

        // Get latest message for this task
        const { data: latestMessage } = await supabase
          .from('realtime.messages')
          .select('*')
          .eq('topic', `task_${task.id}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('realtime.messages')
          .select('*', { count: 'exact', head: true })
          .eq('topic', `task_${task.id}`)
          .neq('sender_id', userId)

        chats.push({
          id: `chat_${task.id}`,
          task_id: task.id,
          customer_id: task.customer_id,
          tasker_id: task.tasker_id,
          created_at: task.created_at || new Date().toISOString(),
          updated_at: latestMessage?.created_at || task.updated_at || new Date().toISOString(),
          task_title: task.title,
          customer_name: task.profiles?.full_name,
          tasker_name: task.profiles?.full_name,
          last_message: latestMessage?.payload?.message || '',
          last_message_time: latestMessage?.created_at || task.updated_at || new Date().toISOString(),
          unread_count: unreadCount || 0
        })
      }

      // Sort by last message time
      return chats.sort((a, b) => 
        new Date(b.last_message_time || b.updated_at).getTime() - 
        new Date(a.last_message_time || a.updated_at).getTime()
      )
    } catch (error) {
      console.error('Error getting user chats:', error)
      return []
    }
  }

  // Get or create chat between customer and tasker for a task
  static async getOrCreateChat(taskId: string, customerId: string, taskerId: string): Promise<Chat | null> {
    try {
      // Get task details
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          customer_id,
          tasker_id,
          profiles!tasks_customer_id_fkey(full_name),
          profiles!tasks_tasker_id_fkey(full_name)
        `)
        .eq('id', taskId)
        .single()

      if (taskError) throw taskError

      return {
        id: `chat_${taskId}`,
        task_id: taskId,
        customer_id: customerId,
        tasker_id: taskerId,
        created_at: task.created_at || new Date().toISOString(),
        updated_at: task.updated_at || new Date().toISOString(),
        task_title: task.title,
        customer_name: task.profiles?.full_name,
        tasker_name: task.profiles?.full_name,
        last_message: '',
        last_message_time: task.updated_at || new Date().toISOString(),
        unread_count: 0
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  // Send a message
  static async sendMessage(taskId: string, senderId: string, message: string): Promise<ChatMessage | null> {
    try {
      const messageData = {
        topic: `task_${taskId}`,
        payload: {
          message,
          sender_id: senderId,
          task_id: taskId
        },
        event: 'INSERT',
        private: false
      }

      const { data, error } = await supabase
        .from('realtime.messages')
        .insert([messageData])
        .select()
        .single()

      if (error) throw error

      // Get sender profile for display
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', senderId)
        .single()

      return {
        id: data.id,
        task_id: taskId,
        sender_id: senderId,
        message,
        created_at: data.created_at,
        updated_at: data.updated_at,
        sender_name: profile?.full_name,
        sender_avatar: profile?.avatar_url
      }
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Get messages for a chat
  static async getChatMessages(taskId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('realtime.messages')
        .select('*')
        .eq('topic', `task_${taskId}`)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Get sender profiles
      const senderIds = [...new Set(data.map(msg => msg.payload?.sender_id).filter(Boolean))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', senderIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      return data.map(msg => ({
        id: msg.id,
        task_id: taskId,
        sender_id: msg.payload?.sender_id || '',
        message: msg.payload?.message || '',
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        sender_name: profileMap.get(msg.payload?.sender_id)?.full_name,
        sender_avatar: profileMap.get(msg.payload?.sender_id)?.avatar_url
      }))
    } catch (error) {
      console.error('Error getting chat messages:', error)
      return []
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(taskId: string, userId: string): Promise<void> {
    try {
      // In a real implementation, you would track read status
      // For now, we'll just log the action
      console.log(`Marking messages as read for task ${taskId} by user ${userId}`)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  // Search chats
  static async searchChats(userId: string, query: string): Promise<Chat[]> {
    try {
      const chats = await this.getUserChats(userId)
      return chats.filter(chat => 
        chat.task_title?.toLowerCase().includes(query.toLowerCase()) ||
        chat.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
        chat.tasker_name?.toLowerCase().includes(query.toLowerCase())
      )
    } catch (error) {
      console.error('Error searching chats:', error)
      return []
    }
  }

  // Archive chat (not implemented in current schema)
  static async archiveChat(chatId: string): Promise<boolean> {
    try {
      // Archive functionality would need to be implemented in the database
      console.log(`Archiving chat ${chatId}`)
      return true
    } catch (error) {
      console.error('Error archiving chat:', error)
      return false
    }
  }
}