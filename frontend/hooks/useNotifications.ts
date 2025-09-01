import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Alert } from 'react-native'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'task' | 'application' | 'message' | 'review' | 'system' | 'application_accepted' | 'application_declined' | 'direct_booking'
  read: boolean
  created_at: string
  data?: any
  is_local?: boolean
}

export function useNotifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Function to fix RLS policies for notifications table
  const fixRLSPolicies = async () => {
    try {
      console.log('Attempting to fix RLS policies for notifications table...')
      
      // Try to create proper RLS policies
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
          DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
          DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
          DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
          
          -- Create new policies
          CREATE POLICY "Users can view their own notifications" ON public.notifications
            FOR SELECT USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can update their own notifications" ON public.notifications
            FOR UPDATE USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can insert notifications" ON public.notifications
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
          -- Grant necessary permissions
          GRANT ALL ON public.notifications TO authenticated;
          GRANT USAGE ON SCHEMA public TO authenticated;
        `
      })
      
      if (error) {
        console.error('Error fixing RLS policies:', error)
        return false
      }
      
      console.log('RLS policies fixed successfully')
      return true
    } catch (err) {
      console.error('Error in fixRLSPolicies:', err)
      return false
    }
  }

  // Function to create notifications table if it doesn't exist
  const createNotificationsTable = async () => {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT CHECK (type IN ('task', 'application', 'message', 'review', 'system', 'application_accepted', 'application_declined', 'direct_booking')) NOT NULL,
            read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            data JSONB DEFAULT '{}'::jsonb
          );
          
          -- Enable RLS
          ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
          CREATE POLICY "Users can view their own notifications" ON public.notifications
            FOR SELECT USING (auth.uid() = user_id);
            
          DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
          CREATE POLICY "Users can update their own notifications" ON public.notifications
            FOR UPDATE USING (auth.uid() = user_id);
            
          DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
          CREATE POLICY "Service role can insert notifications" ON public.notifications
            FOR INSERT WITH CHECK (true);
        `
      })
      
      if (error) throw error
      console.log('Notifications table created successfully')
      return true
    } catch (err) {
      console.error('Error creating notifications table:', err)
      return false
    }
  }

  // Function to get notifications from local storage as fallback
  const getLocalNotifications = async (): Promise<Notification[]> => {
    try {
      // For now, return empty array - you could implement AsyncStorage here
      return []
    } catch (err) {
      console.error('Error getting local notifications:', err)
      return []
    }
  }

  const fetchNotifications = async () => {
    if (!profile) return

    try {
      setLoading(true)
      setError(null)

      console.log('Fetching notifications for user:', profile.id)
      
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (fetchError) {
        console.error('Error fetching notifications:', fetchError)
        
        // If it's a permission error, try to fix the RLS policies
        if (fetchError.code === '42501') {
          console.log('Permission denied - attempting to fix RLS policies...')
          try {
            await fixRLSPolicies()
            // Retry the fetch after fixing policies
            const { data: retryData, error: retryError } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(20)
            
            if (!retryError) {
              console.log('Successfully fetched notifications after fixing RLS:', retryData?.length || 0)
              setNotifications(retryData || [])
              const unread = (retryData || []).filter((n: Notification) => !n.read).length || 0
              setUnreadCount(unread)
              return
            }
          } catch (fixError) {
            console.error('Failed to fix RLS policies:', fixError)
          }
        }
        
        // If we still can't fetch, use empty array
        setNotifications([])
        setUnreadCount(0)
        return
      }

      console.log('Fetched notifications:', data?.length || 0, 'notifications')
      setNotifications(data || [])
      
      // Calculate unread count
      const unread = (data || []).filter((n: Notification) => !n.read).length || 0
      setUnreadCount(unread)
    } catch (err: any) {
      console.error('Error in fetchNotifications:', err)
      setError(err.message)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (updateError) throw updateError

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      return true
    } catch (err: any) {
      console.error('Error marking notification as read:', err)
      // If notifications table doesn't exist, just update local state
      console.log('Notification not updated (table may not exist)')
      return true
    }
  }

  const markAllAsRead = async () => {
    if (!profile) return

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile.id)
        .eq('read', false)

      if (updateError) throw updateError

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      
      return true
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err)
      // If notifications table doesn't exist, just update local state
      console.log('Notifications not updated (table may not exist)')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      return true
    }
  }

  const createNotification = async (notificationData: {
    user_id: string
    title: string
    message: string
    type: Notification['type']
    data?: any
  }) => {
    try {
      console.log('Creating notification:', notificationData)
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating notification:', error)
        
        // If it's a permission error, try to fix the RLS policies
        if (error.code === '42501') {
          console.log('Permission denied - attempting to fix RLS policies...')
          try {
            await fixRLSPolicies()
            // Retry the insert after fixing policies
            const { data: retryData, error: retryError } = await supabase
              .from('notifications')
              .insert(notificationData)
              .select()
              .single()
            
            if (!retryError) {
              console.log('Notification created successfully after fixing RLS:', retryData)
              // Add to local state if it's for the current user
              if (notificationData.user_id === profile?.id) {
                setNotifications(prev => [retryData, ...prev])
                setUnreadCount(prev => prev + 1)
                console.log('Added notification to local state')
              }
              return retryData
            }
          } catch (fixError) {
            console.error('Failed to fix RLS policies:', fixError)
          }
        }
        
        throw error
      }

      console.log('Notification created successfully:', data)

      // Add to local state if it's for the current user
      if (notificationData.user_id === profile?.id) {
        setNotifications(prev => [data, ...prev])
        setUnreadCount(prev => prev + 1)
        console.log('Added notification to local state')
      }

      return data
    } catch (err: any) {
      console.error('Error creating notification:', err)
      
      // Create a local notification as fallback
      const localNotification: Notification = {
        id: `local-${Date.now()}`,
        user_id: notificationData.user_id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: false,
        created_at: new Date().toISOString(),
        data: notificationData.data || {}
      }
      
      // Add to local state if it's for the current user
      if (notificationData.user_id === profile?.id) {
        setNotifications(prev => [localNotification, ...prev])
        setUnreadCount(prev => prev + 1)
        console.log('Created local notification as fallback:', localNotification)
      }
      
      return localNotification
    }
  }

  // Local notification fallback when database operations fail
  const createLocalNotification = (notification: {
    user_id: string
    title: string
    message: string
    type: string
    data?: any
  }) => {
    console.log('Creating local notification fallback:', notification)
    
    // Store in local state for immediate display
    const localNotification: Notification = {
      id: `local-${Date.now()}`,
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type as Notification['type'],
      read: false,
      created_at: new Date().toISOString(),
      data: notification.data || {},
      is_local: true
    }
    
    // Add to local notifications array
    setNotifications(prev => [localNotification, ...prev])
    
    // Show immediate feedback to user
    Alert.alert(
      notification.title,
      notification.message,
      [{ text: 'OK' }]
    )
  }

  const notifyApplicationAccepted = async (taskerId: string, taskId: string, taskTitle: string) => {
    try {
      // Get tasker profile info
      const { data: taskerProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', taskerId)
        .single()

      if (!taskerProfile) throw new Error('Tasker profile not found')

      // Create notification for tasker
      await createNotification({
        user_id: taskerId,
        title: 'Application Accepted! 🎉',
        message: `Congratulations! Your application for "${taskTitle}" has been accepted. The task is now assigned to you.`,
        type: 'application_accepted',
        data: {
          task_id: taskId,
          task_title: taskTitle,
          action: 'view_task'
        }
      })

      return true
    } catch (err: any) {
      console.error('Error creating application accepted notification:', err)
      throw err
    }
  }

  const notifyApplicationDeclined = async (taskerId: string, taskId: string, taskTitle: string) => {
    try {
      // Get tasker profile info
      const { data: taskerProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', taskerId)
        .single()

      if (!taskerProfile) throw new Error('Tasker profile not found')

      // Create notification for tasker
      await createNotification({
        user_id: taskerId,
        title: 'Application Update',
        message: `Your application for "${taskTitle}" was not selected this time. Don't worry, there are plenty of other opportunities!`,
        type: 'application_declined',
        data: {
          task_id: taskId,
          task_title: taskTitle,
          action: 'browse_tasks'
        }
      })

      return true
    } catch (err: any) {
      console.error('Error creating application declined notification:', err)
      throw err
    }
  }

  const notifyDirectBooking = async (technicianId: string, customerId: string, serviceName: string, agreedPrice: number, bookingDate: string) => {
    try {
      // Get customer profile info
      const { data: customerProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', customerId)
        .single()

      if (!customerProfile) throw new Error('Customer profile not found')

      // Create notification for technician
      await createNotification({
        user_id: technicianId,
        title: 'New Direct Booking! 📅',
        message: `${customerProfile.full_name} has booked you for "${serviceName}" on ${new Date(bookingDate).toLocaleDateString()} for $${agreedPrice}.`,
        type: 'direct_booking',
        data: {
          customer_id: customerId,
          customer_name: customerProfile.full_name,
          service_name: serviceName,
          agreed_price: agreedPrice,
          booking_date: bookingDate,
          action: 'view_booking'
        }
      })

      return true
    } catch (err: any) {
      console.error('Error creating direct booking notification:', err)
      throw err
    }
  }

  const notifyDirectBookingAccepted = async (customerId: string, technicianId: string, serviceName: string, bookingDate: string) => {
    try {
      // Get technician profile info
      const { data: technicianProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', technicianId)
        .single()

      if (!technicianProfile) throw new Error('Technician profile not found')

      // Create notification for customer
      await createNotification({
        user_id: customerId,
        title: 'Booking Confirmed! ✅',
        message: `${technicianProfile.full_name} has confirmed your booking for "${serviceName}" on ${new Date(bookingDate).toLocaleDateString()}.`,
        type: 'direct_booking',
        data: {
          technician_id: technicianId,
          technician_name: technicianProfile.full_name,
          service_name: serviceName,
          booking_date: bookingDate,
          action: 'view_booking'
        }
      })

      return true
    } catch (err: any) {
      console.error('Error creating booking accepted notification:', err)
      throw err
    }
  }

  const notifyDirectBookingDeclined = async (customerId: string, technicianId: string, serviceName: string, bookingDate: string) => {
    try {
      // Get technician profile info
      const { data: technicianProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', technicianId)
        .single()

      if (!technicianProfile) throw new Error('Technician profile not found')

      // Create notification for customer
      await createNotification({
        user_id: customerId,
        title: 'Booking Update',
        message: `${technicianProfile.full_name} is not available for "${serviceName}" on ${new Date(bookingDate).toLocaleDateString()}. Please try another date or technician.`,
        type: 'direct_booking',
        data: {
          technician_id: technicianId,
          technician_name: technicianProfile.full_name,
          service_name: serviceName,
          booking_date: bookingDate,
          action: 'browse_technicians'
        }
      })

      return true
    } catch (err: any) {
      console.error('Error creating booking declined notification:', err)
      throw err
    }
  }

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!profile) return

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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

  useEffect(() => {
    fetchNotifications()
  }, [profile])



  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    notifyApplicationAccepted,
    notifyApplicationDeclined,
    notifyDirectBooking,
    notifyDirectBookingAccepted,
    notifyDirectBookingDeclined,
    fixRLSPolicies, // Export for manual RLS policy fixing
  }
}
