import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface TaskCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export function useCategories() {
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('task_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError

      setCategories(data || [])
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, []) // Empty dependency array - only runs once on mount

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  }
}