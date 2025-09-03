import { supabase } from '../lib/supabase'

export interface Tasker {
  id: string
  user_id: string
  application_id: string
  status: 'active' | 'inactive' | 'suspended'
  approved_at: string
  approved_by?: string
  suspension_reason?: string
  suspension_until?: string
  created_at: string
  updated_at: string
  
  // Tasker-specific fields
  hourly_rate?: number
  availability_status: 'available' | 'busy' | 'offline'
  response_time: string
  completion_rate: number
  total_earnings: number
  total_tasks_completed: number
  average_rating: number
  total_reviews: number
  
  // Location and service area
  service_radius_km: number
  preferred_locations?: string[]
  
  // Skills and specializations
  primary_skills?: string[]
  certifications?: string[]
  languages?: string[]
  
  // Availability schedule
  availability_schedule?: any
  
  // Additional info
  bio?: string
  portfolio_images?: string[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
  
  // Verification status
  identity_verified: boolean
  background_check_verified: boolean
  insurance_verified: boolean
  references_verified: boolean
  
  // Joined data
  user_profile?: {
    full_name: string
    username: string
    avatar_url?: string
    email: string
    phone?: string
    city?: string
    state?: string
  }
}

export interface TaskerFilters {
  status?: 'active' | 'inactive' | 'suspended'
  availability_status?: 'available' | 'busy' | 'offline'
  min_hourly_rate?: number
  max_hourly_rate?: number
  min_rating?: number
  skills?: string[]
  location?: string
  service_radius?: number
  verified_only?: boolean
}

export interface TaskerStats {
  total_taskers: number
  active_taskers: number
  available_taskers: number
  average_rating: number
  total_earnings: number
  total_tasks_completed: number
}

export class TaskerService {
  /**
   * Get all taskers with optional filters
   */
  static async getTaskers(
    filters: TaskerFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<Tasker[]> {
    try {
      let query = supabase
        .from('taskers')
        .select(`
          *,
          user_profile:profiles!user_id (
            full_name,
            username,
            avatar_url,
            email,
            phone,
            city,
            state
          )
        `)
        .order('average_rating', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters.availability_status) {
        query = query.eq('availability_status', filters.availability_status)
      }
      
      if (filters.min_hourly_rate) {
        query = query.gte('hourly_rate', filters.min_hourly_rate)
      }
      
      if (filters.max_hourly_rate) {
        query = query.lte('hourly_rate', filters.max_hourly_rate)
      }
      
      if (filters.min_rating) {
        query = query.gte('average_rating', filters.min_rating)
      }
      
      if (filters.verified_only) {
        query = query.eq('identity_verified', true)
          .eq('background_check_verified', true)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter by skills if provided
      if (filters.skills && filters.skills.length > 0) {
        return (data || []).filter(tasker => 
          tasker.primary_skills?.some(skill => 
            filters.skills!.some(filterSkill => 
              skill.toLowerCase().includes(filterSkill.toLowerCase())
            )
          )
        )
      }

      return data || []
    } catch (error: any) {
      console.error('Error fetching taskers:', error)
      throw new Error(`Failed to fetch taskers: ${error.message}`)
    }
  }

  /**
   * Get a specific tasker by user ID
   */
  static async getTaskerByUserId(userId: string): Promise<Tasker | null> {
    try {
      const { data, error } = await supabase
        .from('taskers')
        .select(`
          *,
          user_profile:profiles!user_id (
            full_name,
            username,
            avatar_url,
            email,
            phone,
            city,
            state
          )
        `)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error: any) {
      console.error('Error fetching tasker by user ID:', error)
      throw new Error(`Failed to fetch tasker: ${error.message}`)
    }
  }

  /**
   * Get tasker statistics
   */
  static async getTaskerStats(): Promise<TaskerStats> {
    try {
      const { data, error } = await supabase
        .from('taskers')
        .select('status, availability_status, average_rating, total_earnings, total_tasks_completed')

      if (error) throw error

      const taskers = data || []
      const activeTaskers = taskers.filter(t => t.status === 'active')
      const availableTaskers = activeTaskers.filter(t => t.availability_status === 'available')

      return {
        total_taskers: taskers.length,
        active_taskers: activeTaskers.length,
        available_taskers: availableTaskers.length,
        average_rating: taskers.length > 0 
          ? taskers.reduce((sum, t) => sum + (t.average_rating || 0), 0) / taskers.length 
          : 0,
        total_earnings: taskers.reduce((sum, t) => sum + (t.total_earnings || 0), 0),
        total_tasks_completed: taskers.reduce((sum, t) => sum + (t.total_tasks_completed || 0), 0)
      }
    } catch (error: any) {
      console.error('Error fetching tasker stats:', error)
      throw new Error(`Failed to fetch tasker stats: ${error.message}`)
    }
  }

  /**
   * Update tasker profile
   */
  static async updateTaskerProfile(
    userId: string,
    updates: Partial<Pick<Tasker, 
      'hourly_rate' | 'availability_status' | 'response_time' | 'bio' | 
      'primary_skills' | 'certifications' | 'languages' | 'portfolio_images' |
      'service_radius_km' | 'preferred_locations' | 'availability_schedule' |
      'emergency_contact_name' | 'emergency_contact_phone'
    >>
  ): Promise<Tasker> {
    try {
      const { data, error } = await supabase
        .from('taskers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select(`
          *,
          user_profile:profiles!user_id (
            full_name,
            username,
            avatar_url,
            email,
            phone,
            city,
            state
          )
        `)
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error updating tasker profile:', error)
      throw new Error(`Failed to update tasker profile: ${error.message}`)
    }
  }

  /**
   * Update tasker availability status
   */
  static async updateAvailabilityStatus(
    userId: string,
    status: 'available' | 'busy' | 'offline'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('taskers')
        .update({
          availability_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error updating availability status:', error)
      throw new Error(`Failed to update availability status: ${error.message}`)
    }
  }

  /**
   * Search taskers by location and skills
   */
  static async searchTaskers(
    searchQuery: string,
    location?: string,
    skills?: string[],
    limit: number = 20
  ): Promise<Tasker[]> {
    try {
      let query = supabase
        .from('taskers')
        .select(`
          *,
          user_profile:profiles!user_id (
            full_name,
            username,
            avatar_url,
            email,
            phone,
            city,
            state
          )
        `)
        .eq('status', 'active')
        .eq('availability_status', 'available')
        .order('average_rating', { ascending: false })
        .limit(limit)

      // If location is provided, filter by preferred locations
      if (location) {
        query = query.contains('preferred_locations', [location])
      }

      const { data, error } = await query

      if (error) throw error

      let results = data || []

      // Filter by search query (name, skills, bio)
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase()
        results = results.filter(tasker => 
          tasker.user_profile?.full_name?.toLowerCase().includes(queryLower) ||
          tasker.bio?.toLowerCase().includes(queryLower) ||
          tasker.primary_skills?.some(skill => 
            skill.toLowerCase().includes(queryLower)
          )
        )
      }

      // Filter by skills if provided
      if (skills && skills.length > 0) {
        results = results.filter(tasker => 
          tasker.primary_skills?.some(skill => 
            skills.some(searchSkill => 
              skill.toLowerCase().includes(searchSkill.toLowerCase())
            )
          )
        )
      }

      return results
    } catch (error: any) {
      console.error('Error searching taskers:', error)
      throw new Error(`Failed to search taskers: ${error.message}`)
    }
  }

  /**
   * Get nearby taskers
   */
  static async getNearbyTaskers(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20
  ): Promise<Tasker[]> {
    try {
      // This would require a more complex query with PostGIS or similar
      // For now, we'll return all available taskers
      // In a real implementation, you'd use ST_DWithin or similar spatial functions
      
      const { data, error } = await supabase
        .from('taskers')
        .select(`
          *,
          user_profile:profiles!user_id (
            full_name,
            username,
            avatar_url,
            email,
            phone,
            city,
            state
          )
        `)
        .eq('status', 'active')
        .eq('availability_status', 'available')
        .order('average_rating', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error fetching nearby taskers:', error)
      throw new Error(`Failed to fetch nearby taskers: ${error.message}`)
    }
  }
}
