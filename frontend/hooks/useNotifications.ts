import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import NotificationService from '../services/NotificationService'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  data?: Record<string, any>
}

export const useNotifications = () => {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
      
      // Update unread count
      const unread = data?.filter(n => !n.read).length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }, [fetchNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true }
            : n
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!profile?.id) return

    try {
      await NotificationService.markAllAsRead(profile.id)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
      
      // Update unread count
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [profile?.id])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId)
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      // Update unread count if notification was unread
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [notifications])

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'tasker_application_approved':
        return 'checkmark-circle'
      case 'tasker_application_rejected':
        return 'close-circle'
      case 'task_application_received':
        return 'document-text'
      case 'task_application_accepted':
        return 'checkmark-circle'
      case 'task_application_rejected':
        return 'close-circle'
      case 'task_assigned':
        return 'clipboard'
      case 'task_completed':
        return 'checkmark-done-circle'
      case 'task_cancelled':
        return 'close-circle'
      case 'payment_received':
        return 'card'
      case 'payment_sent':
        return 'card'
      case 'review_received':
        return 'star'
      case 'message':
        return 'chatbubble'
      case 'booking_confirmed':
        return 'calendar'
      case 'booking_cancelled':
        return 'close-circle'
      case 'system_announcement':
        return 'megaphone'
      default:
        return 'notifications'
    }
  }, [])

  const getNotificationColor = useCallback((type: string) => {
    switch (type) {
      case 'tasker_application_approved':
      case 'task_application_accepted':
      case 'task_assigned':
      case 'task_completed':
      case 'payment_received':
      case 'review_received':
      case 'booking_confirmed':
        return '#22C55E' // success green
      case 'tasker_application_rejected':
      case 'task_application_rejected':
      case 'task_cancelled':
      case 'booking_cancelled':
        return '#EF4444' // error red
      case 'task_application_received':
      case 'message':
        return '#3B82F6' // primary blue
      case 'payment_sent':
        return '#6B7280' // neutral gray
      case 'system_announcement':
        return '#F59E0B' // warning yellow
      default:
        return '#6B7280' // neutral gray
    }
  }, [])

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'tasker_application_approved':
      case 'tasker_application_rejected':
        // Navigate to profile or application status
        // You can implement navigation logic here
        break
      case 'task_application_received':
      case 'task_application_accepted':
      case 'task_application_rejected':
        // Navigate to task details
        // You can implement navigation logic here
        break
      case 'task_assigned':
      case 'task_completed':
        // Navigate to task details
        // You can implement navigation logic here
        break
      case 'payment_received':
      case 'payment_sent':
        // Navigate to payment history
        // You can implement navigation logic here
        break
      case 'review_received':
        // Navigate to reviews
        // You can implement navigation logic here
        break
      case 'message':
        // Navigate to chat
        // You can implement navigation logic here
        break
      case 'booking_confirmed':
      case 'booking_cancelled':
        // Navigate to bookings
        // You can implement navigation logic here
        break
      default:
        // Default behavior
        break
    }
  }, [markAsRead])

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications(prev => 
            prev.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          )
          
          // Update unread count
          if (updatedNotification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          const deletedNotification = payload.old as Notification
          setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id))
          
          // Update unread count if notification was unread
          if (!deletedNotification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    loading,
    refreshing,
    unreadCount,
    onRefresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon,
    getNotificationColor,
    handleNotificationPress
  }
}
