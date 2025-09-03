import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from './useNotifications'
import { ChatCleanupService } from '../services/ChatCleanupService'

export interface TaskBooking {
  id: string
  customer_id: string
  tasker_id?: string
  category_id: string
  title: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  task_date?: string
  task_time?: string
  flexible_date: boolean
  estimated_hours?: number
  budget: number
  final_price?: number
  task_size: 'small' | 'medium' | 'large'
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  urgency: 'flexible' | 'within_week' | 'urgent'
  special_instructions?: string
  photos?: string[]
  created_at: string
  updated_at: string
  completed_at?: string
  
  // Joined data
  task_categories?: {
    name: string
    slug: string
    icon: string
    color: string
  }
  customer_profile?: {
    full_name: string
    username: string
    avatar_url?: string
    rating_average: number
    rating_count: number
  }
  tasker_profile?: {
    full_name: string
    username: string
    avatar_url?: string
    rating_average: number
    rating_count: number
    hourly_rate?: number
  }
  applications_count?: number
}

export function useBookings() {
  const { profile } = useAuth()
  const { 
    notifyDirectBooking, 
    notifyDirectBookingAccepted, 
    notifyDirectBookingDeclined 
  } = useNotifications()
  const [bookings, setBookings] = useState<TaskBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = async () => {
    if (!profile) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('tasks')
        .select(`
          *,
          task_categories (name, slug, icon, color),
          customer_profile:profiles!customer_id (full_name, username, avatar_url, rating_average, rating_count),
          tasker_profile:profiles!tasker_id (full_name, username, avatar_url, rating_average, rating_count, hourly_rate)
        `)

      // Filter based on user role
      if (profile?.role === 'customer' && profile?.id) {
        // Customers see their own tasks (for management)
        query = query.eq('customer_id', profile.id)
      } else if ((profile?.role === 'tasker' || profile?.role === 'both') && profile?.id) {
        // Taskers see tasks assigned to them
        query = query.eq('tasker_id', profile.id)
      } else {
        // Unauthenticated users see empty list
        setBookings([])
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Get application counts for each task
      if (data && data.length > 0) {
        const taskIds = data.map(task => task.id)
        const { data: applicationCounts } = await supabase
          .from('task_applications')
          .select('task_id')
          .in('task_id', taskIds)

        // Count applications per task
        const countsMap = applicationCounts?.reduce((acc, app) => {
          acc[app.task_id] = (acc[app.task_id] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        // Add counts to tasks
        const tasksWithCounts = data.map(task => ({
          ...task,
          applications_count: countsMap[task.id] || 0
        }))

        setBookings(tasksWithCounts)
      } else {
        setBookings([])
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, status: TaskBooking['status']) => {
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Refresh bookings after update
      await fetchBookings()
      return true
    } catch (err: any) {
      console.error('Error updating booking status:', err)
      throw err
    }
  }

  const cancelBooking = async (bookingId: string) => {
    try {
      // Update the task status directly since we're working with tasks table
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'cancelled',
          tasker_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (taskError) throw taskError

      // Delete associated chats when task is cancelled
      await ChatCleanupService.deleteChatsForCancelledTask(bookingId)

      // Refresh bookings after update
      await fetchBookings()
      return true
    } catch (err: any) {
      console.error('Error cancelling booking:', err)
      throw err
    }
  }

  const confirmBooking = async (bookingId: string) => {
    try {
      // Update the task status directly since we're working with tasks table
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (taskError) throw taskError

      // Refresh bookings after update
      await fetchBookings()
      return true
    } catch (err: any) {
      console.error('Error confirming booking:', err)
      throw err
    }
  }

  const completeBooking = async (bookingId: string) => {
    try {
      // Update the task status directly since we're working with tasks table
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (taskError) throw taskError

      // Delete associated chats when task is completed
      await ChatCleanupService.deleteChatsForCompletedTask(bookingId)

      // Refresh bookings after update
      await fetchBookings()
      return true
    } catch (err: any) {
      console.error('Error completing booking:', err)
      throw err
    }
  }

  const assignTasker = async (taskId: string, taskerId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          tasker_id: taskerId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      await fetchBookings() // Refresh bookings list
      return true
    } catch (err: any) {
      console.error('Error assigning tasker:', err)
      throw err
    }
  }

  const createBooking = async (bookingData: {
    customer_id: string
    technician_id: string
    service_name: string
    service_description: string
    agreed_price: number
    booking_date: string
    start_time: string
    estimated_hours: number
    customer_notes?: string
  }) => {
    try {
      // Create the direct booking
      const { data: booking, error: bookingError } = await supabase
        .from('direct_bookings')
        .insert({
          customer_id: bookingData.customer_id,
          technician_id: bookingData.technician_id,
          service_name: bookingData.service_name,
          service_description: bookingData.service_description,
          agreed_price: bookingData.agreed_price,
          booking_date: bookingData.booking_date,
          start_time: bookingData.start_time,
          estimated_hours: bookingData.estimated_hours,
          customer_notes: bookingData.customer_notes,
          status: 'pending'
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Create a chat for the direct booking
      try {
        // Check if chat already exists first
        const { data: existingChat, error: checkError } = await supabase
          .from('chats')
          .select('*')
          .is('task_id', null)
          .eq('customer_id', bookingData.customer_id)
          .eq('tasker_id', bookingData.technician_id)
          .limit(1)

        if (checkError) {
          console.warn('Error checking for existing chat:', checkError)
        } else if (existingChat && existingChat.length > 0) {
          console.log('Chat already exists for direct booking')
        } else {
          // Create new chat
          const { error: chatError } = await supabase
            .from('chats')
            .insert({
              task_id: null, // Direct bookings don't have task_id
              customer_id: bookingData.customer_id,
              tasker_id: bookingData.technician_id
            })

          if (chatError) {
            if (chatError.code === '23505') {
              console.log('Chat already exists (duplicate key) for direct booking')
            } else {
              console.warn('Failed to create chat for direct booking:', chatError)
            }
          } else {
            console.log('Chat created successfully for direct booking:', booking.id)
          }
        }
      } catch (chatErr) {
        console.warn('Error creating chat for direct booking:', chatErr)
        // Don't fail the whole operation if chat creation fails
      }

      // Send notification to technician
      await notifyDirectBooking(
        bookingData.technician_id,
        bookingData.customer_id,
        bookingData.service_name,
        bookingData.agreed_price,
        bookingData.booking_date
      )

      await fetchBookings() // Refresh bookings list
      return booking
    } catch (err: any) {
      console.error('Error creating direct booking:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [profile])

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    updateBookingStatus,
    cancelBooking,
    confirmBooking,
    completeBooking,
    assignTasker,
    createBooking,
  }
}
