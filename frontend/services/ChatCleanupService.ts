import { supabase } from '../lib/supabase'

export class ChatCleanupService {
  /**
   * Delete all chats associated with a completed task
   * @param taskId - The ID of the completed task
   */
  static async deleteChatsForCompletedTask(taskId: string): Promise<void> {
    try {
      console.log('Deleting chats for completed task:', taskId)
      
      // First, get all chat IDs for this task
      const { data: chats, error: chatsQueryError } = await supabase
        .from('chats')
        .select('id')
        .eq('task_id', taskId)

      if (chatsQueryError) {
        console.error('Error fetching chats:', chatsQueryError)
        // Don't throw - this is cleanup, not critical
        return
      }

      // If there are chats, delete their messages first
      if (chats && chats.length > 0) {
        const chatIds = chats.map(chat => chat.id)
        
        const { error: messagesError } = await supabase
          .from('chat_messages')
          .delete()
          .in('chat_id', chatIds)

        if (messagesError) {
          console.error('Error deleting chat messages:', messagesError)
          // Check if it's a permission error
          if (messagesError.code === '42501') {
            console.warn('Permission denied for chat_messages table. This may be due to RLS policies.')
            console.warn('Please run the CLEANUP_CHAT_POLICIES.sql script in your Supabase dashboard.')
            // Don't throw the error, just log it
            return
          }
          // For other errors, also don't throw to prevent task completion failure
          console.warn('Failed to delete chat messages, but continuing with task completion')
          return
        }
      }

      // Then delete the chats themselves
      const { error: chatsError } = await supabase
        .from('chats')
        .delete()
        .eq('task_id', taskId)

      if (chatsError) {
        console.error('Error deleting chats:', chatsError)
        // Don't throw - this is cleanup, not critical
        return
      }

      console.log('Successfully deleted chats for completed task:', taskId)
    } catch (error) {
      console.error('Error in deleteChatsForCompletedTask:', error)
      // Don't throw the error to prevent task completion from failing
      // Just log it for debugging
    }
  }

  /**
   * Delete chats for cancelled tasks as well
   * @param taskId - The ID of the cancelled task
   */
  static async deleteChatsForCancelledTask(taskId: string): Promise<void> {
    try {
      console.log('Deleting chats for cancelled task:', taskId)
      
      // First, get all chat IDs for this task
      const { data: chats, error: chatsQueryError } = await supabase
        .from('chats')
        .select('id')
        .eq('task_id', taskId)

      if (chatsQueryError) {
        console.error('Error fetching chats:', chatsQueryError)
        // Don't throw - this is cleanup, not critical
        return
      }

      // If there are chats, delete their messages first
      if (chats && chats.length > 0) {
        const chatIds = chats.map(chat => chat.id)
        
        const { error: messagesError } = await supabase
          .from('chat_messages')
          .delete()
          .in('chat_id', chatIds)

        if (messagesError) {
          console.error('Error deleting chat messages:', messagesError)
          // Check if it's a permission error
          if (messagesError.code === '42501') {
            console.warn('Permission denied for chat_messages table. This may be due to RLS policies.')
            console.warn('Please run the CLEANUP_CHAT_POLICIES.sql script in your Supabase dashboard.')
            // Don't throw the error, just log it
            return
          }
          // For other errors, also don't throw to prevent task cancellation failure
          console.warn('Failed to delete chat messages, but continuing with task cancellation')
          return
        }
      }

      // Then delete the chats themselves
      const { error: chatsError } = await supabase
        .from('chats')
        .delete()
        .eq('task_id', taskId)

      if (chatsError) {
        console.error('Error deleting chats:', chatsError)
        // Don't throw - this is cleanup, not critical
        return
      }

      console.log('Successfully deleted chats for cancelled task:', taskId)
    } catch (error) {
      console.error('Error in deleteChatsForCancelledTask:', error)
      // Don't throw the error to prevent task cancellation from failing
    }
  }
}
