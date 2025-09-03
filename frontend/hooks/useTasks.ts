import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChatCleanupService } from '../services/ChatCleanupService'

// Helper function to convert DD/MM/YYYY to YYYY-MM-DD format
const formatDateForDatabase = (dateString: string): string => {
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  
  // If it's in DD/MM/YYYY format, convert it
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  // If it's in MM/DD/YYYY format, convert it
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    const [month, day, year] = dateString.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  // If it's any other format, try to parse it with Date
  try {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch (e) {
    console.warn('Could not parse date:', dateString)
  }
  
  // If all else fails, return the original string
  return dateString
}

export interface Task {
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
  }
  applications_count?: number
}

export interface TaskApplication {
  id: string
  task_id: string
  tasker_id: string
  applicant_id?: string
  message: string
  proposed_price: number
  estimated_time: number
  availability_date: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  proposed_duration?: string
  attachments?: string[]
  is_cover_letter?: boolean
  
  // Joined data
  tasker_profile?: {
    full_name: string
    username: string
    avatar_url?: string
    rating_average: number
    rating_count: number
    hourly_rate?: number
    bio?: string
    skills?: string[]
  }
}

export const useTasks = () => {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)



      let query = supabase
        .from('tasks')
        .select(`
          *,
          task_categories (name, slug, icon, color),
          customer_profile:profiles!customer_id (full_name, username, avatar_url, rating_average, rating_count),
          tasker_profile:profiles!tasker_id (full_name, username, avatar_url, rating_average, rating_count)
        `)

      // Filter based on user role
      if (profile?.role === 'customer' && profile?.id) {
        // Customers see their own tasks (for management) plus all open tasks (to see what's available)
        // Use a simpler approach: first get customer's own tasks, then get open tasks from others
        const { data: ownTasks, error: ownError } = await supabase
          .from('tasks')
          .select(`
            *,
            task_categories (name, slug, icon, color),
            customer_profile:profiles!customer_id (full_name, username, avatar_url, rating_average, rating_count),
            tasker_profile:profiles!tasker_id (full_name, username, avatar_url, rating_average, rating_count)
          `)
          .eq('customer_id', profile.id)
          .order('created_at', { ascending: false })

        if (ownError) throw ownError

        const { data: openTasks, error: openError } = await supabase
          .from('tasks')
          .select(`
            *,
            task_categories (name, slug, icon, color),
            customer_profile:profiles!customer_id (full_name, username, avatar_url, rating_average, rating_count),
            tasker_profile:profiles!tasker_id (full_name, username, avatar_url, rating_average, rating_count)
          `)
          .eq('status', 'open')
          .neq('customer_id', profile.id)
          .order('created_at', { ascending: false })

        if (openError) throw openError

        // Combine the results
        const combinedTasks = [...(ownTasks || []), ...(openTasks || [])]
        const sortedTasks = combinedTasks.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        // Get application counts for combined tasks
        if (sortedTasks.length > 0) {
          const taskIds = sortedTasks.map(task => task.id)
          const { data: applicationCounts } = await supabase
            .from('task_applications')
            .select('task_id')
            .in('task_id', taskIds)

          const countsMap = applicationCounts?.reduce((acc, app) => {
            acc[app.task_id] = (acc[app.task_id] || 0) + 1
            return acc
          }, {} as Record<string, number>) || {}

          const tasksWithCounts = sortedTasks.map(task => ({
            ...task,
            applications_count: countsMap[task.id] || 0
          }))

          setTasks(tasksWithCounts)
        } else {
          setTasks([])
        }
        return // Exit early for customers
      } else if ((profile?.role === 'tasker' || profile?.role === 'both') && profile?.id) {
        // Taskers see ALL open tasks (to apply to) plus tasks assigned to them
        query = query.or(`status.eq.open,tasker_id.eq.${profile.id}`)
      } else {
        // Unauthenticated users or unknown roles see all open tasks
        query = query.eq('status', 'open')
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        // Check if the data is valid (has proper titles)
        const hasValidData = data.every(task => 
          task.title && 
          typeof task.title === 'string' && 
          task.title.length > 0 && 
          !task.title.includes('-') // UUIDs typically contain hyphens
        )
        
        if (!hasValidData) {
          throw new Error('Invalid task data structure')
        }
      }

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

        setTasks(tasksWithCounts)
      } else {
        setTasks([])
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err)
      // Fallback to mock data if Supabase fails
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_NAME_NOT_RESOLVED')) {

        const MOCK_TASKS: Task[] = [
          {
            id: '1',
            customer_id: 'customer-demo',
            category_id: '1',
            title: 'House Cleaning Needed',
            description: 'Need help with deep cleaning of a 2-bedroom apartment. Includes kitchen, bathroom, and living areas.',
            address: '123 Main St',
            city: 'Downtown',
            state: 'CA',
            zip_code: '90210',
            task_size: 'medium',
            budget: 100,
            urgency: 'urgent',
            status: 'open',
            flexible_date: false,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            task_categories: {
              name: 'Cleaning',
              slug: 'cleaning',
              icon: 'water',
              color: '#3B82F6'
            },
                       customer_profile: {
             full_name: 'Sarah M.',
             username: 'sarah_m',
             avatar_url: undefined,
             rating_average: 4.5,
             rating_count: 12
           },
            applications_count: 3
          }
        ]
        setTasks(MOCK_TASKS)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (taskData: {
    title: string
    description: string
    category_id: string
    address: string
    city: string
    state: string
    zip_code: string
    task_size: 'small' | 'medium' | 'large'
    budget: number
    task_date?: string
    task_time?: string
    urgency: 'flexible' | 'within_week' | 'urgent'
    special_instructions?: string
  }) => {
    try {

      
      if (!profile) {
        console.error('No user profile found')
        throw new Error('User not authenticated')
      }




      // Create task object that exactly matches the database schema
      const taskToInsert = {
        customer_id: profile.id,
        category_id: taskData.category_id,
        title: taskData.title,
        description: taskData.description,
        address: taskData.address,
        city: taskData.city,
        state: taskData.state,
        zip_code: taskData.zip_code,
        task_size: taskData.task_size,
        urgency: taskData.urgency,
        status: 'open',
        flexible_date: !taskData.task_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Optional fields - only include if they have values
        ...(taskData.task_date && { task_date: formatDateForDatabase(taskData.task_date) }),
        ...(taskData.task_time && { task_time: taskData.task_time }),
        ...(taskData.budget && { budget: taskData.budget }),
        ...(taskData.special_instructions && { requirements: [taskData.special_instructions] }),
      }

      
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskToInsert)
        .select()
        .single()

      if (error) {
        console.error('=== Supabase insert error ===')
        console.error('Error details:', error)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        console.error('Error code:', error.code)
        throw error
      }


      await fetchTasks() // Refresh tasks list
      
      return data
    } catch (err: any) {
      console.error('=== Error in createTask function ===')
      console.error('Error type:', typeof err)
      console.error('Error details:', err)
      console.error('Error message:', err.message)
      if (err.stack) console.error('Error stack:', err.stack)
      throw err
    }
  }

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', taskId)

      if (error) throw error

      // Delete associated chats when task is completed or cancelled
      if (status === 'completed') {
        await ChatCleanupService.deleteChatsForCompletedTask(taskId)
      } else if (status === 'cancelled') {
        await ChatCleanupService.deleteChatsForCancelledTask(taskId)
      }

      await fetchTasks() // Refresh tasks list
    } catch (err: any) {
      console.error('Error updating task status:', err)
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

      await fetchTasks() // Refresh tasks list
    } catch (err: any) {
      console.error('Error assigning tasker:', err)
      throw err
    }
  }

  useEffect(() => {
    if (profile) {
      fetchTasks()
    }
  }, [profile])

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTaskStatus,
    assignTasker,
  }
}

export const useTaskApplications = (taskId?: string) => {
  const authResult = useAuth()
  const { profile } = authResult
  
  const [applications, setApplications] = useState<TaskApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to update user role to 'both' if they're currently 'customer'
  const updateUserRole = async () => {
    try {

      
      if (!profile?.id) {
        throw new Error('No user profile found')
      }
      
      if (profile.role === 'customer' || !profile.role) {

        const { error } = await supabase
          .from('profiles')
          .update({ role: 'both' })
          .eq('id', profile.id)
        
        if (error) {
          console.error('Error updating role:', error)
          throw error
        }
        

        
        // Try to refresh the profile without full page reload
        try {
          const { data: updatedProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profile.id)
            .single()
          
          if (fetchError) {
            console.error('Error fetching updated profile:', fetchError)
            // Fallback to page reload
            window.location.reload()
          } else {

            // Force a re-render by updating the profile in the auth context
            // This is a workaround since we can't directly update the auth context
            window.location.reload()
          }
        } catch (refreshError) {
          console.error('Error refreshing profile:', refreshError)
          window.location.reload()
        }
      } else {

      }
    } catch (err) {
      console.error('Error updating user role:', err)
      throw err
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError(null)



      let query = supabase
        .from('task_applications')
        .select(`
          *,
          tasker_profile:profiles!tasker_id (
            full_name, username, avatar_url, rating_average, rating_count, 
            hourly_rate, bio, skills
          )
        `)

      if (taskId) {
        query = query.eq('task_id', taskId)
      } else if (profile?.role === 'tasker' && profile?.id) {
        query = query.eq('tasker_id', profile.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (err: any) {
      console.error('Error fetching applications:', err)
      // Don't use mock data - just show empty state
      setApplications([])
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const applyToTask = async (taskId: string, applicationData: {
    message: string
    proposed_price: number
    estimated_time: number
    availability_date: string
  }) => {
    try {
      if (!profile) throw new Error('User not authenticated')



      // Check if user has the required role to apply for tasks
      if (profile.role === 'customer' || !profile.role) {
        throw new Error('You must become a verified tasker before applying for tasks. Please submit a tasker application first.')
      }

      // Additional verification: ensure user has tasker role
      if (profile.role !== 'tasker' && profile.role !== 'both') {
        throw new Error('Your account is not verified as a tasker. Please contact support to verify your tasker status.')
      }



      const applicationToInsert = {
        task_id: taskId,
        tasker_id: profile.id,
        message: applicationData.message,
        proposed_price: applicationData.proposed_price,
        estimated_time: applicationData.estimated_time,
        availability_date: applicationData.availability_date,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }



      const { data, error } = await supabase
        .from('task_applications')
        .insert(applicationToInsert)
        .select()
        .single()

      if (error) {
        console.error('=== Supabase insert error ===')
        console.error('Error details:', error)
        throw error
      }



      // Send notification to customer about new application
      try {
        // Get task details for notification
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('title, customer_id')
          .eq('id', taskId)
          .single()

        if (!taskError && taskData) {
          // Get tasker name for notification
          const { data: taskerData, error: taskerError } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', profile.id)
            .single()

          if (!taskerError && taskerData) {
            const taskerName = taskerData.full_name || taskerData.username || 'A tasker'
            
            // Import and call the notification service
            const { TaskNotificationService } = await import('../services/TaskNotificationService')
            await TaskNotificationService.notifyTaskApplicationSubmitted(
              taskId,
              profile.id,
              taskData.customer_id,
              taskData.title,
              taskerName
            )

          }
        }
      } catch (notificationError) {
        console.error('Failed to send application notification:', notificationError)
        // Don't fail the application submission if notification fails
      }

      await fetchApplications() // Refresh applications list
      return data
    } catch (err: any) {
      console.error('=== Error in applyToTask function ===')
      console.error('Error type:', typeof err)
      console.error('Error details:', err)
      console.error('Error message:', err.message)
      if (err.stack) console.error('Error stack:', err.stack)
      throw err
    }
  }

  const updateApplicationStatus = async (applicationId: string, status: TaskApplication['status']) => {
    try {
      const { error } = await supabase
        .from('task_applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (error) throw error

      await fetchApplications() // Refresh applications list
    } catch (err: any) {
      console.error('Error updating application status:', err)
      throw err
    }
  }

  useEffect(() => {
    if (profile && (taskId || profile.role === 'tasker')) {
      fetchApplications()
    }
  }, [profile, taskId])



  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
    applyToTask,
    updateApplicationStatus,
    updateUserRole,
    profile,
  }
}