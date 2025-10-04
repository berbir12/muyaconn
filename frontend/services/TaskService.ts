import { supabase } from '../lib/supabase'

export interface Task {
  id: string
  title: string
  description: string
  budget: number
  address: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
  task_date?: string
  task_time?: string
  flexible_date: boolean
  estimated_hours?: number
  task_size: 'small' | 'medium' | 'large'
  urgency: 'flexible' | 'within_week' | 'urgent'
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  customer_id: string
  tasker_id?: string
  category_id: string
  requirements?: string[]
  attachments?: string[]
  tags?: string[]
  is_featured: boolean
  is_urgent: boolean
  expires_at?: string
  completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  customer_rating?: number
  customer_review?: string
  tasker_rating?: number
  tasker_review?: string
  payment_status: 'pending' | 'partial' | 'completed' | 'refunded'
  payment_method?: string
  transaction_id?: string
  final_price?: number
  special_instructions?: string
  photos?: string[]
  estimated_duration_hours?: number
  created_at: string
  updated_at: string
  // Additional fields for display
  customer_name?: string
  tasker_name?: string
  category_name?: string
  applications_count?: number
}

export interface TaskApplication {
  id: string
  task_id: string
  tasker_id: string
  proposed_price: number
  estimated_time: number
  status: 'pending' | 'accepted' | 'rejected'
  message: string
  attachments?: string[]
  availability_date: string
  estimated_hours?: number
  created_at: string
  updated_at: string
  // Additional fields for display
  tasker_name?: string
  tasker_rating?: number
}

export class TaskService {
  // Get all available tasks (open status, not assigned to current user)
  static async getAvailableTasks(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_customer_id_fkey(full_name),
          task_categories(name)
        `)
        .eq('status', 'open')
        .neq('customer_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(task => ({
        ...task,
        customer_name: task.profiles?.full_name,
        category_name: task.task_categories?.name,
        applications_count: 0 // Will be calculated separately
      }))
    } catch (error) {
      console.error('Error getting available tasks:', error)
      return []
    }
  }

  // Get user's posted tasks
  static async getMyTasks(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_tasker_id_fkey(full_name),
          task_categories(name)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(task => ({
        ...task,
        tasker_name: task.profiles?.full_name,
        category_name: task.task_categories?.name,
        applications_count: 0 // Will be calculated separately
      }))
    } catch (error) {
      console.error('Error getting my tasks:', error)
      return []
    }
  }

  // Get user's assigned tasks (as tasker)
  static async getMyAssignedTasks(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_customer_id_fkey(full_name),
          task_categories(name)
        `)
        .eq('tasker_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(task => ({
        ...task,
        customer_name: task.profiles?.full_name,
        category_name: task.task_categories?.name,
        applications_count: 0 // Will be calculated separately
      }))
    } catch (error) {
      console.error('Error getting assigned tasks:', error)
      return []
    }
  }

  // Create a new task
  static async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'applications_count'>): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select(`
          *,
          profiles!tasks_customer_id_fkey(full_name),
          task_categories(name)
        `)
        .single()

      if (error) throw error

      return {
        ...data,
        customer_name: data.profiles?.full_name,
        category_name: data.task_categories?.name,
        applications_count: 0
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  // Apply to a task
  static async applyToTask(taskId: string, taskerId: string, proposedPrice: number, message: string, availabilityDate: string): Promise<boolean> {
    try {
      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('task_applications')
        .select('id')
        .eq('task_id', taskId)
        .eq('tasker_id', taskerId)
        .single()

      if (existingApplication) {
        return false // Already applied
      }

      // Create application
      const { error } = await supabase
        .from('task_applications')
        .insert([{
          task_id: taskId,
          tasker_id: taskerId,
          proposed_price: proposedPrice,
          estimated_time: 1, // Default to 1 hour
          message,
          availability_date: availabilityDate,
          status: 'pending'
        }])

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error applying to task:', error)
      return false
    }
  }

  // Accept an application
  static async acceptApplication(taskId: string, applicationId: string): Promise<boolean> {
    try {
      // Get application details
      const { data: application, error: appError } = await supabase
        .from('task_applications')
        .select('tasker_id, proposed_price')
        .eq('id', applicationId)
        .single()

      if (appError) throw appError

      // Update task status and assign tasker
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'assigned',
          tasker_id: application.tasker_id,
          final_price: application.proposed_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (taskError) throw taskError

      // Update application status
      const { error: appUpdateError } = await supabase
        .from('task_applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId)

      if (appUpdateError) throw appUpdateError

      return true
    } catch (error) {
      console.error('Error accepting application:', error)
      return false
    }
  }

  // Update task status
  static async updateTaskStatus(taskId: string, status: Task['status']): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating task status:', error)
      return false
    }
  }

  // Get task applications
  static async getTaskApplications(taskId: string): Promise<TaskApplication[]> {
    try {
      const { data, error } = await supabase
        .from('task_applications')
        .select(`
          *,
          profiles!task_applications_tasker_id_fkey(full_name, rating_average)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(app => ({
        ...app,
        tasker_name: app.profiles?.full_name,
        tasker_rating: app.profiles?.rating_average
      }))
    } catch (error) {
      console.error('Error getting task applications:', error)
      return []
    }
  }

  // Get user's applications
  static async getMyApplications(userId: string): Promise<TaskApplication[]> {
    try {
      const { data, error } = await supabase
        .from('task_applications')
        .select(`
          *,
          tasks!task_applications_task_id_fkey(title, status, budget)
        `)
        .eq('tasker_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(app => ({
        ...app,
        tasker_name: '', // Not needed for my applications
        tasker_rating: 0
      }))
    } catch (error) {
      console.error('Error getting my applications:', error)
      return []
    }
  }

  // Search tasks
  static async searchTasks(query: string, category?: string): Promise<Task[]> {
    try {
      let queryBuilder = supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_customer_id_fkey(full_name),
          task_categories(name)
        `)
        .eq('status', 'open')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

      if (category && category !== 'All') {
        queryBuilder = queryBuilder.eq('task_categories.name', category)
      }

      const { data, error } = await queryBuilder.order('created_at', { ascending: false })

      if (error) throw error

      return data.map(task => ({
        ...task,
        customer_name: task.profiles?.full_name,
        category_name: task.task_categories?.name,
        applications_count: 0
      }))
    } catch (error) {
      console.error('Error searching tasks:', error)
      return []
    }
  }

  // Get task categories
  static async getTaskCategories(): Promise<{ id: string; name: string; slug: string }[]> {
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting task categories:', error)
      return []
    }
  }
}