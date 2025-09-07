import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { TaskerService, Tasker, TaskerFilters, TaskerStats } from '../services/TaskerService'

export const useTaskers = (filters: TaskerFilters = {}, limit: number = 20) => {
  const [taskers, setTaskers] = useState<Tasker[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters?.search,
    filters?.skills,
    filters?.location,
    filters?.minRating,
    filters?.maxHourlyRate,
    filters?.availability
  ])

  const fetchTaskers = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentOffset = reset ? 0 : offsetRef.current
      const newTaskers = await TaskerService.getTaskers(memoizedFilters, limit, currentOffset)
      
      if (reset) {
        setTaskers(newTaskers)
        offsetRef.current = limit
      } else {
        setTaskers(prev => [...prev, ...newTaskers])
        offsetRef.current += limit
      }
      
      setHasMore(newTaskers.length === limit)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [memoizedFilters, limit])

  const refreshTaskers = useCallback(() => {
    offsetRef.current = 0
    fetchTaskers(true)
  }, [fetchTaskers])

  const loadMoreTaskers = useCallback(() => {
    if (!loading && hasMore) {
      fetchTaskers(false)
    }
  }, [loading, hasMore, fetchTaskers])

  // Initial fetch with stable dependencies
  useEffect(() => {
    fetchTaskers(true)
  }, []) // Remove fetchTaskers from dependencies to prevent infinite loops

  return {
    taskers,
    loading,
    error,
    hasMore,
    refreshTaskers,
    loadMoreTaskers
  }
}

export const useTasker = (userId: string) => {
  const [tasker, setTasker] = useState<Tasker | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasker = useCallback(async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const taskerData = await TaskerService.getTaskerByUserId(userId)
      setTasker(taskerData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Initial fetch - removed useEffect to prevent infinite loops
  // fetchTasker will be called manually when needed

  const updateTaskerProfile = useCallback(async (updates: Parameters<typeof TaskerService.updateTaskerProfile>[1]) => {
    if (!userId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const updatedTasker = await TaskerService.updateTaskerProfile(userId, updates)
      setTasker(updatedTasker)
      return updatedTasker
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateAvailabilityStatus = useCallback(async (status: 'available' | 'busy' | 'offline') => {
    if (!userId) return
    
    try {
      setLoading(true)
      setError(null)
      
      await TaskerService.updateAvailabilityStatus(userId, status)
      
      // Update local state
      setTasker(prev => prev ? { ...prev, availability_status: status } : null)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [userId])

  return {
    tasker,
    loading,
    error,
    refreshTasker: fetchTasker,
    updateTaskerProfile,
    updateAvailabilityStatus
  }
}

export const useTaskerStats = () => {
  const [stats, setStats] = useState<TaskerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const taskerStats = await TaskerService.getTaskerStats()
      setStats(taskerStats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch - removed useEffect to prevent infinite loops
  // fetchStats will be called manually when needed

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  }
}

export const useTaskerSearch = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchTaskers = useCallback(async (
    searchQuery: string,
    location?: string,
    skills?: string[],
    limit: number = 20
  ): Promise<Tasker[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const results = await TaskerService.searchTaskers(searchQuery, location, skills, limit)
      return results
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getNearbyTaskers = useCallback(async (
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20
  ): Promise<Tasker[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const results = await TaskerService.getNearbyTaskers(latitude, longitude, radiusKm, limit)
      return results
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    searchTaskers,
    getNearbyTaskers
  }
}