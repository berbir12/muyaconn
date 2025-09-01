import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Chat, 
  ChatMessage, 
  CreateChatRequest, 
  SendMessageRequest, 
  ChatFilters,
  ChatValidationResult,
  ChatUpdate
} from '../types/chat'

export function useChat() {
  const { profile } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Refs for real-time subscriptions
  const chatChannelRef = useRef<any>(null)
  const messageChannelRef = useRef<any>(null)

  // Validate if a chat can be accessed based on task status
  const validateChatAccess = useCallback(async (taskId: string | null): Promise<ChatValidationResult> => {
    if (!profile) {
      return { can_chat: false, reason: 'User not authenticated' }
    }

    // For direct bookings (no task_id), always allow chat
    if (!taskId) {
      return { can_chat: true, task_status: 'direct_booking' }
    }

    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .select('id, status, completed_at, cancelled_at, customer_id, tasker_id')
        .eq('id', taskId)
        .single()

      if (error) {
        console.error('Error fetching task for chat validation:', error)
        return { can_chat: false, reason: 'Task not found' }
      }

      if (!task) {
        return { can_chat: false, reason: 'Task not found' }
      }

      // Check if user is involved in the task
      if (task.customer_id !== profile.id && task.tasker_id !== profile.id) {
        return { can_chat: false, reason: 'Not authorized to access this chat' }
      }

      // Check if task is active (not completed or cancelled)
      if (task.status === 'completed' || task.status === 'cancelled') {
        return { 
          can_chat: false, 
          reason: task.status === 'completed' ? 'Task completed' : 'Task cancelled',
          task_status: task.status
        }
      }

      // Check if task has been assigned (for customers) or accepted (for taskers)
      if (task.status === 'open') {
        return { can_chat: false, reason: 'Task not yet assigned' }
      }

      // Allow chat for 'assigned', 'in_progress', and other active statuses
      return { can_chat: true, task_status: task.status }
    } catch (err) {
      console.error('Error validating chat access:', err)
      return { can_chat: false, reason: 'Error validating access' }
    }
  }, [profile])

  // Fetch user's chats with task status validation
  const fetchChats = useCallback(async (filters?: ChatFilters) => {
    if (!profile) return

    try {
      setLoading(true)
      setError(null)

      // Fetch chats with task information (for task-based chats)
      const { data: chatsData, error: fetchError } = await supabase
        .from('chats')
        .select(`
          *,
          tasks(
            id,
            title,
            status,
            completed_at,
            cancelled_at,
            budget
          )
        `)
        .or(`customer_id.eq.${profile.id},tasker_id.eq.${profile.id}`)
        .order('last_message_at', { ascending: false })

      if (fetchError) {
        console.error('Chat fetch error:', fetchError)
        if (fetchError.code === '42501') {
          setChats([])
          setError('Chat functionality not available yet')
          return
        }
        throw fetchError
      }

      // Process chats and filter by active status if requested
      const processedChats = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const task = chat.tasks
          const isActive = !task || (task.status !== 'completed' && task.status !== 'cancelled')
          const chatType = task ? 'task' : 'direct_booking'
          
          // Filter out inactive chats if requested
          if (filters?.active_only && !isActive) {
            return null
          }

          const unreadCount = await getUnreadCount(chat.id, profile.id)
          
          return {
            ...chat,
            task: task ? {
              id: task.id,
              title: task.title,
              status: task.status,
              budget: task.budget,
              completed_at: task.completed_at,
              cancelled_at: task.cancelled_at
            } : undefined,
            unread_count: unreadCount,
            is_active: isActive,
            chat_type: chatType,
            last_message: null,
            customer_profile: null,
            tasker_profile: null
          }
        })
      )

      // Filter out null chats and set state
      const validChats = processedChats.filter(chat => chat !== null) as Chat[]
      setChats(validChats)
    } catch (err: any) {
      console.error('Error fetching chats:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [profile])

  // Get unread message count for a chat
  const getUnreadCount = async (chatId: string, userId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .is('read_at', null)

      if (error) {
        console.error('Unread count error:', error)
        if (error.code === '42501') {
          return 0
        }
        throw error
      }
      return count || 0
    } catch (err) {
      console.error('Error getting unread count:', err)
      return 0
    }
  }

  // Create a new chat with validation
  const createChat = useCallback(async (chatData: CreateChatRequest): Promise<Chat | null> => {
    if (!profile) return null

    try {
      setError(null)

      // Validate chat access before creating (only for task-based chats)
      if (chatData.task_id) {
        const validation = await validateChatAccess(chatData.task_id)
        if (!validation.can_chat) {
          setError(validation.reason || 'Cannot create chat for this task')
          return null
        }
      }

      const { data, error } = await supabase
        .from('chats')
        .insert(chatData)
        .select('*')
        .single()

      if (error) {
        console.error('Create chat error:', error)
        if (error.code === '42501') {
          setError('Chat functionality not available yet')
          return null
        }
        throw error
      }

      // Add to local state
      setChats(prev => [data, ...prev])
      return data
    } catch (err: any) {
      console.error('Error creating chat:', err)
      setError(err.message)
      return null
    }
  }, [profile, validateChatAccess])

  // Send a message with validation
  const sendMessage = useCallback(async (messageData: SendMessageRequest): Promise<ChatMessage | null> => {
    if (!profile) return null

    try {
      setError(null)

      // Find the chat to validate task status
      const chat = chats.find(c => c.id === messageData.chat_id)
      if (!chat) {
        setError('Chat not found')
        return null
      }

      // Validate chat access before sending message
      const validation = await validateChatAccess(chat.task_id || null)
      if (!validation.can_chat) {
        setError(validation.reason || 'Cannot send message for this chat')
        return null
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          ...messageData,
          sender_id: profile.id
        })
        .select('*')
        .single()

      if (error) {
        console.error('Send message error:', error)
        if (error.code === '42501') {
          setError('Chat functionality not available yet')
          return null
        }
        throw error
      }

      // Add to local messages if we're in the current chat
      if (currentChat && messageData.chat_id === currentChat.id) {
        setMessages(prev => [...prev, data])
      }

      // Update chat's last_message_at
      try {
        const { error: updateError } = await supabase
          .from('chats')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', messageData.chat_id)
        
        if (updateError && updateError.code === '42501') {
          console.log('Chat functionality not available yet')
        }
      } catch (err) {
        console.error('Error updating chat timestamp:', err)
      }

      // Refresh chats to update order
      fetchChats()

      return data
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message)
      return null
    }
  }, [profile, currentChat, fetchChats, chats, validateChatAccess])

  // Fetch messages for a specific chat with validation
  const fetchMessages = useCallback(async (chatId: string) => {
    if (!profile) return

    try {
      setLoading(true)
      setError(null)

      // Find the chat to validate task status
      const chat = chats.find(c => c.id === chatId)
      if (!chat) {
        setError('Chat not found')
        return
      }

      // Validate chat access before fetching messages
      const validation = await validateChatAccess(chat.task_id || null)
      if (!validation.can_chat) {
        setError(validation.reason || 'Cannot access messages for this chat')
        return
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Fetch messages error:', error)
        if (error.code === '42501') {
          setError('Chat functionality not available yet')
          return
        }
        throw error
      }

      setMessages(data || [])

      // Mark messages as read
      await markMessagesAsRead(chatId, profile.id)
    } catch (err: any) {
      console.error('Error fetching messages:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [profile, chats, validateChatAccess])

  // Mark messages as read
  const markMessagesAsRead = async (chatId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .is('read_at', null)
      
      if (error && error.code === '42501') {
        console.log('Chat functionality not available yet')
        return
      }
    } catch (err) {
      console.error('Error marking messages as read:', err)
    }
  }

  // Set current chat and fetch its messages
  const selectChat = useCallback(async (chat: Chat) => {
    // Validate chat access before selecting
    const validation = await validateChatAccess(chat.task_id || null)
    if (!validation.can_chat) {
      setError(validation.reason || 'Cannot access this chat')
      return
    }

    setCurrentChat(chat)
    await fetchMessages(chat.id)
  }, [fetchMessages, validateChatAccess])

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!profile || chats.length === 0) return

    // Clean up existing subscriptions
    if (chatChannelRef.current) {
      supabase.removeChannel(chatChannelRef.current)
    }
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current)
    }

    // Subscribe to chat updates
    chatChannelRef.current = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `id=in.(${chats.map(c => c.id).join(',')})`
        },
        (payload) => {
          const updatedChat = payload.new as Chat
          setChats(prev => 
            prev.map(chat => 
              chat.id === updatedChat.id 
                ? { ...chat, ...updatedChat }
                : chat
            )
          )
        }
      )
      .subscribe()

    // Subscribe to new messages
    messageChannelRef.current = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=in.(${chats.map(c => c.id).join(',')})`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          
          // Add to messages if we're in the current chat
          if (currentChat && newMessage.chat_id === currentChat.id) {
            setMessages(prev => [...prev, newMessage])
          }

          // Update chat's last_message_at
          setChats(prev => 
            prev.map(chat => 
              chat.id === newMessage.chat_id 
                ? { ...chat, last_message_at: newMessage.created_at }
                : chat
            )
          )

          // Mark as read if we're the recipient
          if (newMessage.sender_id !== profile.id) {
            markMessagesAsRead(newMessage.chat_id, profile.id)
          }
        }
      )
      .subscribe()

    setIsConnected(true)
  }, [profile, chats, currentChat])

  // Clean up subscriptions
  const cleanupSubscriptions = useCallback(() => {
    if (chatChannelRef.current) {
      supabase.removeChannel(chatChannelRef.current)
      chatChannelRef.current = null
    }
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current)
      messageChannelRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Set up real-time subscriptions when chats change
  useEffect(() => {
    setupRealtimeSubscriptions()
    return cleanupSubscriptions
  }, [setupRealtimeSubscriptions, cleanupSubscriptions])

  // Initial fetch
  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions()
    }
  }, [cleanupSubscriptions])

  return {
    chats,
    currentChat,
    messages,
    loading,
    error,
    isConnected,
    fetchChats,
    createChat,
    sendMessage,
    selectChat,
    markMessagesAsRead,
    validateChatAccess
  }
}