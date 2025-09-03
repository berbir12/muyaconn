import { supabase } from '../lib/supabase'

export interface NotificationData {
  user_id: string
  title: string
  message: string
  type: NotificationType
  data?: Record<string, any>
}

export type NotificationType = 
  | 'task'
  | 'application'
  | 'message'
  | 'review'
  | 'system'
  | 'application_accepted'
  | 'application_declined'
  | 'direct_booking'

export class NotificationService {
  /**
   * Send a notification to a specific user
   */
  static async sendNotification(notification: NotificationData): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data || {},
          read: false,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error sending notification:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
      throw error
    }
  }

  /**
   * Send notification for tasker application approval
   */
  static async notifyTaskerApplicationApproved(userId: string, adminNotes?: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      title: 'Application Approved! 🎉',
      message: `Congratulations! Your tasker application has been approved. You can now start accepting tasks and earning money.${adminNotes ? ` Admin notes: ${adminNotes}` : ''}`,
      type: 'application',
      data: { admin_notes: adminNotes }
    })
  }

  /**
   * Send notification for tasker application rejection
   */
  static async notifyTaskerApplicationRejected(userId: string, reason: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      title: 'Application Update',
      message: `Your tasker application has been reviewed. Unfortunately, it was not approved at this time. Reason: ${reason}. You can reapply after addressing the feedback.`,
      type: 'application',
      data: { rejection_reason: reason }
    })
  }

  /**
   * Send notification to admin when new tasker application is received
   */
  static async notifyAdminNewTaskerApplication(adminUserId: string, applicantName: string): Promise<void> {
    await this.sendNotification({
      user_id: adminUserId,
      title: 'New Tasker Application',
      message: `New tasker application received from ${applicantName}. Please review and take action.`,
      type: 'application',
      data: { applicant_name: applicantName }
    })
  }

  /**
   * Send notification when task application is received by customer
   */
  static async notifyCustomerTaskApplicationReceived(customerId: string, taskerName: string, taskTitle: string): Promise<void> {
    await this.sendNotification({
      user_id: customerId,
      title: 'New Task Application',
      message: `${taskerName} has applied for your task: "${taskTitle}". Review their proposal and make a decision.`,
      type: 'application',
      data: { tasker_name: taskerName, task_title: taskTitle }
    })
  }

  /**
   * Send notification when task application is accepted
   */
  static async notifyTaskApplicationAccepted(taskerId: string, taskTitle: string, customerName: string): Promise<void> {
    await this.sendNotification({
      user_id: taskerId,
      title: 'Application Accepted! 🎯',
      message: `Great news! Your application for "${taskTitle}" has been accepted by ${customerName}. Start working on the task!`,
      type: 'application_accepted',
      data: { task_title: taskTitle, customer_name: customerName }
    })
  }

  /**
   * Send notification when task application is rejected
   */
  static async notifyTaskApplicationRejected(taskerId: string, taskTitle: string, customerName: string, reason?: string): Promise<void> {
    await this.sendNotification({
      user_id: taskerId,
      title: 'Application Update',
      message: `Your application for "${taskTitle}" was not selected by ${customerName}.${reason ? ` Reason: ${reason}` : ''} Don't worry, keep applying to other tasks!`,
      type: 'application_declined',
      data: { task_title: taskTitle, customer_name: customerName, reason }
    })
  }

  /**
   * Send notification when task is assigned
   */
  static async notifyTaskAssigned(taskerId: string, taskTitle: string, customerName: string): Promise<void> {
    await this.sendNotification({
      user_id: taskerId,
      title: 'Task Assigned! 📋',
      message: `You have been assigned to "${taskTitle}" by ${customerName}. Check the task details and start working!`,
      type: 'task',
      data: { task_title: taskTitle, customer_name: customerName }
    })
  }

  /**
   * Send notification when task is completed
   */
  static async notifyTaskCompleted(customerId: string, taskTitle: string, taskerName: string): Promise<void> {
    await this.sendNotification({
      user_id: customerId,
      title: 'Task Completed! ✅',
      message: `Your task "${taskTitle}" has been completed by ${taskerName}. Please review and rate their work.`,
      type: 'task',
      data: { task_title: taskTitle, tasker_name: taskerName }
    })
  }

  /**
   * Send notification when task is cancelled
   */
  static async notifyTaskCancelled(userId: string, taskTitle: string, reason: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      title: 'Task Cancelled',
      message: `The task "${taskTitle}" has been cancelled. Reason: ${reason}`,
      type: 'task',
      data: { task_title: taskTitle, reason }
    })
  }

  /**
   * Send notification for payment received
   */
  static async notifyPaymentReceived(userId: string, amount: number, taskTitle?: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      title: 'Payment Received! 💰',
      message: `You have received a payment of $${amount}${taskTitle ? ` for "${taskTitle}"` : ''}.`,
      type: 'system',
      data: { amount, task_title: taskTitle }
    })
  }

  /**
   * Send notification for payment sent
   */
  static async notifyPaymentSent(userId: string, amount: number, taskTitle?: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      title: 'Payment Sent',
      message: `Payment of $${amount} has been sent${taskTitle ? ` for "${taskTitle}"` : ''}.`,
      type: 'system',
      data: { amount, task_title: taskTitle }
    })
  }

  /**
   * Send notification for new review received
   */
  static async notifyReviewReceived(userId: string, reviewerName: string, rating: number, taskTitle?: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      title: 'New Review Received! ⭐',
      message: `${reviewerName} gave you a ${rating}-star review${taskTitle ? ` for "${taskTitle}"` : ''}. Check it out!`,
      type: 'review',
      data: { reviewer_name: reviewerName, rating, task_title: taskTitle }
    })
  }

  /**
   * Send notification for new message received
   */
  static async notifyMessageReceived(userId: string, senderName: string, taskTitle?: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      title: 'New Message',
      message: `You have a new message from ${senderName}${taskTitle ? ` regarding "${taskTitle}"` : ''}.`,
      type: 'message',
      data: { sender_name: senderName, task_title: taskTitle }
    })
  }

  /**
   * Send notification for booking confirmation
   */
  static async notifyBookingConfirmed(userId: string, serviceName: string, date: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      title: 'Booking Confirmed! 📅',
      message: `Your booking for ${serviceName} on ${date} has been confirmed.`,
      type: 'direct_booking',
      data: { service_name: serviceName, date }
    })
  }

  /**
   * Send notification for booking cancellation
   */
  static async notifyBookingCancelled(userId: string, serviceName: string, date: string, reason?: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      title: 'Booking Cancelled',
      message: `Your booking for ${serviceName} on ${date} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'direct_booking',
      data: { service_name: serviceName, date, reason }
    })
  }

  /**
   * Send system announcement to all users or specific users
   */
  static async sendSystemAnnouncement(userIds: string[], title: string, message: string): Promise<void> {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type: 'system',
      data: { is_system: true }
    }))

    // Send notifications in batches to avoid overwhelming the database
    const batchSize = 100
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      const { error } = await supabase
        .from('notifications')
        .insert(batch.map(n => ({
          ...n,
          read: false,
          created_at: new Date().toISOString()
        })))

      if (error) {
        console.error('Error sending batch notifications:', error)
        throw error
      }
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error getting unread count:', error)
        throw error
      }

      return count || 0
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }
}

export default NotificationService

