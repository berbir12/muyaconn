import { supabase } from '../lib/supabase'

export class ChatCleanupService {
  /**
   * Delete all chats associated with a completed task
   * @param taskId - The ID of the completed task
   */
  static async deleteChatsForCompletedTask(taskId: string): Promise<void> {
    try {
      console.log('Deleting chats for completed task:', taskId)
      
      // First, delete all chat messages for this task's chats
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .in('chat_id', 
          supabase
            .from('chats')
            .select('id')
            .eq('task_id', taskId)
        )

      if (messagesError) {
        console.error('Error deleting chat messages:', messagesError)
        throw messagesError
      }

      // Then delete the chats themselves
      const { error: chatsError } = await supabase
        .from('chats')
        .delete()
        .eq('task_id', taskId)

      if (chatsError) {
        console.error('Error deleting chats:', chatsError)
        throw chatsError
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
      
      // First, delete all chat messages for this task's chats
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .in('chat_id', 
          supabase
            .from('chats')
            .select('id')
            .eq('task_id', taskId)
        )

      if (messagesError) {
        console.error('Error deleting chat messages:', messagesError)
        throw messagesError
      }

      // Then delete the chats themselves
      const { error: chatsError } = await supabase
        .from('chats')
        .delete()
        .eq('task_id', taskId)

      if (chatsError) {
        console.error('Error deleting chats:', chatsError)
        throw chatsError
      }

      console.log('Successfully deleted chats for cancelled task:', taskId)
    } catch (error) {
      console.error('Error in deleteChatsForCancelledTask:', error)
      // Don't throw the error to prevent task cancellation from failing
    }
  }
}
