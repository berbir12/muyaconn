import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface TaskCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export const useCategories = () => {
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      // Fallback to mock categories if Supabase fails
      const MOCK_CATEGORIES = [
        {
          id: '1',
          name: 'Mounting & Installation',
          slug: 'mounting-installation',
          description: 'TV mounting, furniture assembly, and installation services',
          icon: 'hammer-outline',
          color: '#3B82F6',
          is_active: true,
          sort_order: 1,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Furniture Assembly',
          slug: 'furniture-assembly',
          description: 'IKEA and furniture assembly services',
          icon: 'hammer-outline',
          color: '#10B981',
          is_active: true,
          sort_order: 2,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Moving Help',
          slug: 'moving-help',
          description: 'Packing, loading, and moving assistance',
          icon: 'car-outline',
          color: '#F59E0B',
          is_active: true,
          sort_order: 3,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Cleaning',
          slug: 'cleaning',
          description: 'House cleaning and deep cleaning services',
          icon: 'sparkles-outline',
          color: '#8B5CF6',
          is_active: true,
          sort_order: 4,
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Delivery',
          slug: 'delivery',
          description: 'Pickup and delivery services',
          icon: 'bicycle-outline',
          color: '#06B6D4',
          is_active: true,
          sort_order: 5,
          created_at: new Date().toISOString()
        }
      ]
      setCategories(MOCK_CATEGORIES)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  }
}