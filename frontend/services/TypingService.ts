import { supabase } from '../lib/supabase'

export interface TypingEvent {
  chat_id: string
  user_id: string
  user_name: string
  is_typing: boolean
  timestamp: string
}

class TypingService {
  private typingChannels: Map<string, any> = new Map()
  private typingUsers: Map<string, TypingEvent[]> = new Map()
  private callbacks: Map<string, (users: TypingEvent[]) => void> = new Map()

  // Subscribe to typing events for a specific chat
  subscribeToTyping(chatId: string, onTypingUpdate: (users: TypingEvent[]) => void) {
    // Store callback
    this.callbacks.set(chatId, onTypingUpdate)

    // Create channel for this chat
    const channel = supabase
      .channel(`typing_${chatId}`)
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          this.handleTypingEvent(chatId, payload.payload as TypingEvent)
        }
      )
      .subscribe()

    this.typingChannels.set(chatId, channel)
  }

  // Unsubscribe from typing events
  unsubscribeFromTyping(chatId: string) {
    const channel = this.typingChannels.get(chatId)
    if (channel) {
      supabase.removeChannel(channel)
      this.typingChannels.delete(chatId)
    }
    
    this.callbacks.delete(chatId)
    this.typingUsers.delete(chatId)
  }

  // Send typing indicator
  async sendTypingIndicator(chatId: string, userId: string, userName: string, isTyping: boolean) {
    const typingEvent: TypingEvent = {
      chat_id: chatId,
      user_id: userId,
      user_name: userName,
      is_typing: isTyping,
      timestamp: new Date().toISOString()
    }

    const channel = this.typingChannels.get(chatId)
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: typingEvent
      })
    }
  }

  // Handle incoming typing events
  private handleTypingEvent(chatId: string, event: TypingEvent) {
    const currentUsers = this.typingUsers.get(chatId) || []
    
    if (event.is_typing) {
      // Add or update typing user
      const existingIndex = currentUsers.findIndex(u => u.user_id === event.user_id)
      if (existingIndex >= 0) {
        currentUsers[existingIndex] = event
      } else {
        currentUsers.push(event)
      }
    } else {
      // Remove typing user
      const filteredUsers = currentUsers.filter(u => u.user_id !== event.user_id)
      currentUsers.splice(0, currentUsers.length, ...filteredUsers)
    }

    // Clean up old typing events (older than 5 seconds)
    const now = new Date().getTime()
    const validUsers = currentUsers.filter(user => {
      const userTime = new Date(user.timestamp).getTime()
      return (now - userTime) < 5000 // 5 seconds
    })

    this.typingUsers.set(chatId, validUsers)

    // Notify callback
    const callback = this.callbacks.get(chatId)
    if (callback) {
      callback(validUsers)
    }
  }

  // Get current typing users for a chat
  getTypingUsers(chatId: string): TypingEvent[] {
    return this.typingUsers.get(chatId) || []
  }

  // Clean up all subscriptions
  cleanup() {
    this.typingChannels.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.typingChannels.clear()
    this.callbacks.clear()
    this.typingUsers.clear()
  }
}

export const typingService = new TypingService()
