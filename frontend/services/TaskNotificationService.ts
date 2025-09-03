import NotificationService from './NotificationService'
import { supabase } from '../lib/supabase'

export class TaskNotificationService {
  /**
   * Send notification when a task application is submitted
   */
  static async notifyTaskApplicationSubmitted(
    taskId: string,
    taskerId: string,
    customerId: string,
    taskTitle: string,
    taskerName: string
  ): Promise<void> {
    try {
      // Notify customer about new application
      await NotificationService.notifyCustomerTaskApplicationReceived(
        customerId,
        taskerName,
        taskTitle
      )

      // Log the notification event
      console.log(`Task application notification sent to customer ${customerId} for task ${taskId}`)
    } catch (error) {
      console.error('Failed to send task application notification:', error)
      throw error
    }
  }

  /**
   * Send notification when a task application is accepted
   */
  static async notifyTaskApplicationAccepted(
    taskId: string,
    taskerId: string,
    customerId: string,
    taskTitle: string,
    customerName: string
  ): Promise<void> {
    try {
      // Notify tasker about acceptance
      await NotificationService.notifyTaskApplicationAccepted(
        taskerId,
        taskTitle,
        customerName
      )

      // Update task status to assigned
      await this.assignTaskToTasker(taskId, taskerId)

      // Log the notification event
      console.log(`Task application accepted notification sent to tasker ${taskerId} for task ${taskId}`)
    } catch (error) {
      console.error('Failed to send task application accepted notification:', error)
      throw error
    }
  }

  /**
   * Send notification when a task application is rejected
   */
  static async notifyTaskApplicationRejected(
    taskId: string,
    taskerId: string,
    customerId: string,
    taskTitle: string,
    customerName: string,
    reason?: string
  ): Promise<void> {
    try {
      // Notify tasker about rejection
      await NotificationService.notifyTaskApplicationRejected(
        taskerId,
        taskTitle,
        customerName,
        reason
      )

      // Log the notification event
      console.log(`Task application rejected notification sent to tasker ${taskerId} for task ${taskId}`)
    } catch (error) {
      console.error('Failed to send task application rejected notification:', error)
      throw error
    }
  }

  /**
   * Send notification when a task is completed
   */
  static async notifyTaskCompleted(
    taskId: string,
    taskerId: string,
    customerId: string,
    taskTitle: string,
    taskerName: string
  ): Promise<void> {
    try {
      // Notify customer about task completion
      await NotificationService.notifyTaskCompleted(
        customerId,
        taskTitle,
        taskerName
      )

      // Log the notification event
      console.log(`Task completed notification sent to customer ${customerId} for task ${taskId}`)
    } catch (error) {
      console.error('Failed to send task completed notification:', error)
      throw error
    }
  }

  /**
   * Send notification when a task is cancelled
   */
  static async notifyTaskCancelled(
    taskId: string,
    userId: string,
    taskTitle: string,
    reason: string,
    isCustomer: boolean
  ): Promise<void> {
    try {
      // Notify the appropriate user about task cancellation
      await NotificationService.notifyTaskCancelled(
        userId,
        taskTitle,
        reason
      )

      // Log the notification event
      console.log(`Task cancelled notification sent to user ${userId} for task ${taskId}`)
    } catch (error) {
      console.error('Failed to send task cancelled notification:', error)
      throw error
    }
  }

  /**
   * Send notification for payment received
   */
  static async notifyPaymentReceived(
    userId: string,
    amount: number,
    taskTitle?: string
  ): Promise<void> {
    try {
      await NotificationService.notifyPaymentReceived(userId, amount, taskTitle)
      console.log(`Payment received notification sent to user ${userId}`)
    } catch (error) {
      console.error('Failed to send payment received notification:', error)
      throw error
    }
  }

  /**
   * Send notification for payment sent
   */
  static async notifyPaymentSent(
    userId: string,
    amount: number,
    taskTitle?: string
  ): Promise<void> {
    try {
      await NotificationService.notifyPaymentSent(userId, amount, taskTitle)
      console.log(`Payment sent notification sent to user ${userId}`)
    } catch (error) {
      console.error('Failed to send payment sent notification:', error)
      throw error
    }
  }

  /**
   * Send notification for new review received
   */
  static async notifyReviewReceived(
    userId: string,
    reviewerName: string,
    rating: number,
    taskTitle?: string
  ): Promise<void> {
    try {
      await NotificationService.notifyReviewReceived(userId, reviewerName, rating, taskTitle)
      console.log(`Review received notification sent to user ${userId}`)
    } catch (error) {
      console.error('Failed to send review received notification:', error)
      throw error
    }
  }

  /**
   * Send notification for new message received
   */
  static async notifyMessageReceived(
    userId: string,
    senderName: string,
    taskTitle?: string
  ): Promise<void> {
    try {
      await NotificationService.notifyMessageReceived(userId, senderName, taskTitle)
      console.log(`Message received notification sent to user ${userId}`)
    } catch (error) {
      console.error('Failed to send message received notification:', error)
      throw error
    }
  }

  /**
   * Assign task to tasker when application is accepted
   */
  private static async assignTaskToTasker(taskId: string, taskerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          tasker_id: taskerId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) {
        console.error('Error assigning task to tasker:', error)
        throw error
      }

      console.log(`Task ${taskId} assigned to tasker ${taskerId}`)
    } catch (error) {
      console.error('Failed to assign task to tasker:', error)
      throw error
    }
  }

  /**
   * Send notification to all taskers when a new task is posted
   */
  static async notifyNewTaskPosted(
    taskId: string,
    taskTitle: string,
    customerName: string,
    category: string,
    budget: number
  ): Promise<void> {
    try {
      // Get all active taskers in the same category
      const { data: taskers, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'tasker')
        .eq('available', true)
        .contains('skills', [category])

      if (error) {
        console.error('Error fetching taskers for notification:', error)
        return
      }

      if (taskers && taskers.length > 0) {
        const taskerIds = taskers.map(t => t.id)
        
        // Send system announcement to relevant taskers
        await NotificationService.sendSystemAnnouncement(
          taskerIds,
          'New Task Available! 🎯',
          `A new ${category} task has been posted: "${taskTitle}" with a budget of $${budget}. Apply now to get started!`
        )

        console.log(`New task notification sent to ${taskerIds.length} taskers`)
      }
    } catch (error) {
      console.error('Failed to send new task notifications:', error)
      // Don't throw error as this is not critical
    }
  }

  /**
   * Send notification when task status changes
   */
  static async notifyTaskStatusChange(
    taskId: string,
    userId: string,
    taskTitle: string,
    newStatus: string,
    reason?: string
  ): Promise<void> {
    try {
      let title = 'Task Status Updated'
      let message = `Your task "${taskTitle}" status has been updated to ${newStatus}.`

      if (reason) {
        message += ` Reason: ${reason}`
      }

      await NotificationService.sendNotification({
        user_id: userId,
        title,
        message,
        type: 'task_assigned', // Using existing type
        data: { task_id: taskId, new_status: newStatus, reason }
      })

      console.log(`Task status change notification sent to user ${userId} for task ${taskId}`)
    } catch (error) {
      console.error('Failed to send task status change notification:', error)
      throw error
    }
  }

  /**
   * Send reminder notification for pending tasks
   */
  static async sendTaskReminders(): Promise<void> {
    try {
      // Get tasks that are overdue or need attention
      const { data: overdueTasks, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          customer_id,
          tasker_id,
          status,
          created_at,
          task_date
        `)
        .in('status', ['open', 'in_progress'])
        .lt('task_date', new Date().toISOString())

      if (error) {
        console.error('Error fetching overdue tasks:', error)
        return
      }

      if (overdueTasks && overdueTasks.length > 0) {
        for (const task of overdueTasks) {
          // Send reminder to customer if task is still open
          if (task.status === 'open') {
            await NotificationService.sendNotification({
              user_id: task.customer_id,
              title: 'Task Reminder',
              message: `Your task "${task.title}" is still open. Consider reviewing applications or adjusting the requirements.`,
              type: 'system_announcement',
              data: { task_id: task.id, reminder_type: 'open_task' }
            })
          }

          // Send reminder to tasker if task is in progress
          if (task.status === 'in_progress' && task.tasker_id) {
            await NotificationService.sendNotification({
              user_id: task.tasker_id,
              title: 'Task Reminder',
              message: `Your task "${task.title}" is in progress. Please provide updates or mark as completed.`,
              type: 'system_announcement',
              data: { task_id: task.id, reminder_type: 'in_progress_task' }
            })
          }
        }

        console.log(`Task reminders sent for ${overdueTasks.length} tasks`)
      }
    } catch (error) {
      console.error('Failed to send task reminders:', error)
      // Don't throw error as this is not critical
    }
  }
}

export default TaskNotificationService

