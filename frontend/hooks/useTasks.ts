import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChatCleanupService } from '../services/ChatCleanupService'
import { TransactionService } from '../services/TransactionService'
import { ErrorService } from '../services/ErrorService'

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

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!profile?.id) {
        setTasks([])
        return
      }

      // Build optimized query with single database call
      let query = supabase
        .from('tasks')
        .select(`
          *,
          task_categories (name, slug, icon, color),
          customer_profile:profiles!customer_id (full_name, username, avatar_url, rating_average, rating_count),
          tasker_profile:profiles!tasker_id (full_name, username, avatar_url, rating_average, rating_count),
          task_applications (id)
        `)

      // Apply role-based filtering
      if (profile.role === 'customer') {
        // Customers see their own tasks + open tasks from others
        query = query.or(`customer_id.eq.${profile.id},and(status.eq.open,customer_id.neq.${profile.id})`)
      } else if (profile.role === 'tasker') {
        // Taskers see open tasks + tasks assigned to them
        query = query.or(`status.eq.open,tasker_id.eq.${profile.id}`)
      } else if (profile.role === 'both') {
        // Users with both roles see:
        // 1. Open tasks (to apply to)
        // 2. Tasks assigned to them (as tasker)
        // 3. Tasks they created (as customer) - regardless of status until completed
        query = query.or(`status.eq.open,tasker_id.eq.${profile.id},and(customer_id.eq.${profile.id},status.neq.completed)`)
      } else {
        // Default: show only open tasks
        query = query.eq('status', 'open')
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        // Process data and add application counts
        const processedTasks = data.map(task => ({
          ...task,
          applications_count: task.task_applications?.length || 0,
          // Remove the task_applications array as it's not needed in the UI
          task_applications: undefined
        }))

        setTasks(processedTasks)
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
  }, [profile])

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
        throw error
      }

      await fetchTasks() // Refresh tasks list
      
      return data
    } catch (err: any) {
      // Use ErrorService for consistent error handling
      ErrorService.handleError(err, {
        context: 'TaskCreation',
        showAlert: true,
        logError: true,
        fallbackMessage: 'Failed to create task'
      })
      throw err
    }
  }

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      // Use transaction service for task completion
      if (status === 'completed') {
        const result = await TransactionService.completeTask(taskId)
        if (!result.success) {
          throw new Error(result.error || 'Failed to complete task')
        }
        
        // Delete associated chats after successful completion
        await ChatCleanupService.deleteChatsForCompletedTask(taskId)
      } else if (status === 'cancelled') {
        const result = await TransactionService.cancelTask(taskId)
        if (!result.success) {
          throw new Error(result.error || 'Failed to cancel task')
        }
        
        // Delete associated chats after successful cancellation
        await ChatCleanupService.deleteChatsForCancelledTask(taskId)
      } else {
        // For other status updates, use direct update
        const { error } = await supabase
          .from('tasks')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId)

        if (error) throw error
      }

      await fetchTasks() // Refresh tasks list
      
      // If this was a task completion, refresh the user's profile to update stats
      if (status === 'completed') {
        // Import and call profile refresh if available
        try {
          const { refreshProfile } = await import('../contexts/AuthContext')
          if (refreshProfile) {
            await refreshProfile()
          }
        } catch (error) {
          console.warn('Could not refresh profile after task completion:', error)
        }
      }
    } catch (err: any) {
      ErrorService.handleError(err, {
        context: 'TaskStatusUpdate',
        showAlert: true,
        logError: true,
        fallbackMessage: 'Failed to update task status'
      })
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

  const editTask = async (taskId: string, taskData: Partial<Task>) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated')
      }

      // Only allow editing if user is the task owner
      const { data: existingTask, error: fetchError } = await supabase
        .from('tasks')
        .select('customer_id')
        .eq('id', taskId)
        .single()

      if (fetchError) throw fetchError

      if (existingTask.customer_id !== profile.id) {
        throw new Error('You can only edit your own tasks')
      }

      // Check if task can be edited (not in progress or completed)
      if (taskData.status && ['in_progress', 'completed'].includes(taskData.status)) {
        throw new Error('Cannot edit task that is in progress or completed')
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...taskData,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      await fetchTasks() // Refresh tasks list
      return data
    } catch (err: any) {
      console.error('Error editing task:', err)
      throw err
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      console.log('=== DELETE TASK START ===')
      console.log('Deleting task ID:', taskId)
      
      if (!profile) {
        throw new Error('User not authenticated')
      }

      // Simple delete - just delete the task directly
      console.log('Attempting to delete task...')
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      console.log('Delete error:', deleteError)

      if (deleteError) {
        console.error('Delete failed:', deleteError)
        throw new Error(`Failed to delete task: ${deleteError.message}`)
      }

      console.log('Task deleted successfully!')
      console.log('=== DELETE TASK END ===')
      
      // Refresh the tasks list
      await fetchTasks()
      
      return true
    } catch (err: any) {
      console.error('=== DELETE TASK ERROR ===')
      console.error('Error:', err)
      console.error('Message:', err.message)
      console.error('=== END DELETE TASK ERROR ===')
      throw err
    }
  }

  // Initial fetch with stable dependencies
  useEffect(() => {
    if (profile?.id) {
      fetchTasks()
    }
  }, [profile?.id]) // Remove fetchTasks from dependencies to prevent infinite loops

  // Test function to check database permissions
  const testDeletePermission = async (taskId: string) => {
    try {
      console.log('=== TESTING DELETE PERMISSION ===')
      
      // Test 1: Can we read the task?
      console.log('Test 1: Reading task...')
      const { data: readData, error: readError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()
      
      console.log('Read result:', { data: readData, error: readError })
      
      if (readError) {
        console.error('Cannot read task:', readError)
        return { success: false, error: 'Cannot read task', details: readError }
      }
      
      // Test 2: Can we update the task?
      console.log('Test 2: Updating task...')
      const { data: updateData, error: updateError } = await supabase
        .from('tasks')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
      
      console.log('Update result:', { data: updateData, error: updateError })
      
      if (updateError) {
        console.error('Cannot update task:', updateError)
        return { success: false, error: 'Cannot update task', details: updateError }
      }
      
      // Test 3: Can we delete the task?
      console.log('Test 3: Deleting task...')
      const { data: deleteData, error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .select()
      
      console.log('Delete result:', { data: deleteData, error: deleteError })
      
      if (deleteError) {
        console.error('Cannot delete task:', deleteError)
        return { success: false, error: 'Cannot delete task', details: deleteError }
      }
      
      console.log('All tests passed!')
      return { success: true, message: 'All permissions working' }
      
    } catch (err: any) {
      console.error('Test failed:', err)
      return { success: false, error: 'Test failed', details: err }
    }
  }

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTaskStatus,
    assignTasker,
    editTask,
    deleteTask,
    testDeletePermission,
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

  // Initial fetch - removed useEffect to prevent infinite loops
  // fetchApplications will be called manually when needed



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