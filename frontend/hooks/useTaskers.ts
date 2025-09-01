import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Tasker {
  profile_id: string
  username: string
  full_name: string
  avatar_url?: string
  bio?: string
  hourly_rate: number
  is_available: boolean
  rating_average: number
  rating_count: number
  total_tasks_completed: number
  experience_years?: number
  skills: string[]
  certifications?: string[]
  languages?: string[]
  response_time?: string
  location?: string
  city?: string
  state?: string
  created_at: string
}

export const useTaskers = (categoryFilter?: string) => {
  const [taskers, setTaskers] = useState<Tasker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTaskers = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching taskers...')
      
      // Query profiles directly for taskers - simpler approach
      let query = supabase
        .from('profiles')
        .select('*')
        .in('role', ['tasker', 'both'])
        .eq('available', true) // Only show available taskers

      const { data, error } = await query
        .order('hourly_rate', { ascending: true })

      if (error) {
        console.error('Error fetching taskers:', error)
        throw error
      }

      // Transform the data to match our Tasker interface
      const transformedTaskers: Tasker[] = (data || []).map(profile => ({
        profile_id: profile.id,
        username: profile.username || 'Unknown',
        full_name: profile.full_name || 'Unknown',
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        hourly_rate: profile.hourly_rate || 0,
        is_available: profile.available ?? true,
        rating_average: profile.rating_average || 0,
        rating_count: profile.rating_count || 0,
        total_tasks_completed: profile.completed_tasks || 0,
        experience_years: profile.experience_years,
        skills: profile.skills || [],
        certifications: profile.certifications || [],
        languages: profile.languages || [],
        response_time: profile.response_time,
        location: profile.location,
        city: profile.city,
        state: profile.state,
        created_at: profile.created_at
      }))

      // Apply category filter if provided
      let filteredTaskers = transformedTaskers
      if (categoryFilter && categoryFilter !== 'all') {
        filteredTaskers = transformedTaskers.filter(tasker => 
          tasker.skills.some(skill => 
            skill.toLowerCase().includes(categoryFilter.toLowerCase())
          )
        )
      }

      console.log(`Fetched ${filteredTaskers.length} taskers`)
      if (filteredTaskers.length > 0) {
        console.log('Sample tasker:', {
          id: filteredTaskers[0].profile_id,
          name: filteredTaskers[0].full_name,
          rating: filteredTaskers[0].rating_average,
          skills: filteredTaskers[0].skills
        })
      }

      setTaskers(filteredTaskers)
    } catch (err: any) {
      console.error('Error fetching taskers:', err)
      setError(err.message)
      
      // Fallback to mock data if Supabase fails
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_NAME_NOT_RESOLVED') || err.message.includes('permission denied')) {
        console.log('Supabase failed, using mock taskers')
        const MOCK_TASKERS: Tasker[] = [
          {
            profile_id: '1',
            username: 'sarah_w',
            full_name: 'Sarah Wilson',
            avatar_url: undefined,
            bio: 'Experienced cleaner with attention to detail',
            hourly_rate: 45,
            is_available: true,
            rating_average: 4.8,
            rating_count: 127,
            total_tasks_completed: 156,
            experience_years: 5,
            skills: ['Deep Cleaning', 'Organization', 'Pet Care'],
            certifications: ['Professional Cleaning Certificate'],
            languages: ['English', 'Spanish'],
            response_time: '2h',
            city: 'Downtown',
            state: 'CA',
            created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            profile_id: '2',
            username: 'mike_j',
            full_name: 'Mike Johnson',
            avatar_url: undefined,
            bio: 'Licensed plumber with 10+ years experience',
            hourly_rate: 75,
            is_available: true,
            rating_average: 4.9,
            rating_count: 89,
            total_tasks_completed: 203,
            experience_years: 10,
            skills: ['Leak Repair', 'Pipe Installation', 'Drain Cleaning'],
            certifications: ['Licensed Plumber', 'Gas Fitting Certificate'],
            languages: ['English'],
            response_time: '4h',
            city: 'Westside',
            state: 'CA',
            created_at: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ]
        setTaskers(MOCK_TASKERS)
      }
    } finally {
      setLoading(false)
    }
  }

  const getTaskersByCategory = (category: string) => {
    if (category === 'all') return taskers
    
    return taskers.filter(tasker => 
      tasker.skills.some(skill => 
        skill.toLowerCase().includes(category.toLowerCase())
      )
    )
  }

  const getTaskersBySort = (taskers: Tasker[], sortBy: string) => {
    const sorted = [...taskers]
    
    switch (sortBy) {
      case 'rating':
        return sorted.sort((a, b) => b.rating_average - a.rating_average)
      case 'experience':
        return sorted.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0))
      case 'price':
        return sorted.sort((a, b) => a.hourly_rate - b.hourly_rate)
      case 'completed':
        return sorted.sort((a, b) => b.total_tasks_completed - a.total_tasks_completed)
      default:
        return sorted
    }
  }

  useEffect(() => {
    fetchTaskers()
  }, [categoryFilter])

  return {
    taskers,
    loading,
    error,
    refetch: fetchTaskers,
    getTaskersByCategory,
    getTaskersBySort,
  }
}
