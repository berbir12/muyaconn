import { supabase } from '../lib/supabase'

export interface TaskerApplication {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  personal_info: {
    full_name: string
    email: string
    phone: string
    bio: string
    emergency_contact: string
  }
  professional_info: {
    skills: string[]
    experience: string
    hourly_rate: number
    availability: string
    languages: string[]
    certifications: string[]
    portfolio: string[]
  }
  verification: {
    id_verified: boolean
    background_check: boolean
    insurance: boolean
    references: boolean
  }
  rejection_reason?: string
  admin_notes?: string
  reviewed_at?: string
  reviewed_by?: string
  created_at: string
  updated_at: string
}

export class TaskerApplicationService {
  // Submit a tasker application
  static async submitApplication(applicationData: Omit<TaskerApplication, 'id' | 'created_at' | 'updated_at'>): Promise<TaskerApplication | null> {
    try {
      const { data, error } = await supabase
        .from('tasker_applications')
        .insert([applicationData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error submitting tasker application:', error)
      throw error
    }
  }

  // Get user's tasker application
  static async getUserApplication(userId: string): Promise<TaskerApplication | null> {
    try {
      const { data, error } = await supabase
        .from('tasker_applications')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No application found
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Error getting user application:', error)
      return null
    }
  }

  // Update application status (admin only)
  static async updateApplicationStatus(applicationId: string, status: 'approved' | 'rejected', rejectionReason?: string, adminNotes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasker_applications')
        .update({
          status,
          rejection_reason: rejectionReason,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating application status:', error)
      return false
    }
  }

  // Get all pending applications (admin only)
  static async getPendingApplications(): Promise<TaskerApplication[]> {
    try {
      const { data, error } = await supabase
        .from('tasker_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting pending applications:', error)
      return []
    }
  }

  // Check if user is already a tasker
  static async isUserTasker(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('taskers')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return false // Not a tasker
        }
        throw error
      }
      return !!data
    } catch (error) {
      console.error('Error checking if user is tasker:', error)
      return false
    }
  }
}
