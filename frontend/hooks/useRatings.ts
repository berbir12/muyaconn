import { useState, useEffect, useCallback } from 'react'
import { RatingService, Review, ReviewStats, CreateReviewData } from '../services/RatingService'
import { useAuth } from '../contexts/AuthContext'

export const useRatings = () => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReview = useCallback(async (reviewData: CreateReviewData): Promise<Review> => {
    try {
      setLoading(true)
      setError(null)
      
      const review = await RatingService.createReview(reviewData)
      return review
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateReview = useCallback(async (
    reviewId: string, 
    updates: Partial<CreateReviewData>
  ): Promise<Review> => {
    try {
      setLoading(true)
      setError(null)
      
      const review = await RatingService.updateReview(reviewId, updates)
      return review
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteReview = useCallback(async (reviewId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      await RatingService.deleteReview(reviewId)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const addReviewResponse = useCallback(async (
    reviewId: string, 
    responseText: string
  ) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await RatingService.addReviewResponse(reviewId, responseText)
      return response
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleReviewLike = useCallback(async (reviewId: string, isHelpful: boolean): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      await RatingService.toggleReviewLike(reviewId, isHelpful)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const canUserReviewTask = useCallback(async (
    taskId: string, 
    reviewType: 'tasker_to_customer' | 'customer_to_tasker'
  ): Promise<boolean> => {
    try {
      return await RatingService.canUserReviewTask(taskId, reviewType)
    } catch (err: any) {
      console.error('Error checking review eligibility:', err)
      return false
    }
  }, [])

  return {
    loading,
    error,
    createReview,
    updateReview,
    deleteReview,
    addReviewResponse,
    toggleReviewLike,
    canUserReviewTask
  }
}

export const useUserReviews = (userId: string, limit: number = 20) => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const fetchReviews = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentOffset = reset ? 0 : offset
      const newReviews = await RatingService.getUserReviews(userId, limit, currentOffset)
      
      if (reset) {
        setReviews(newReviews)
        setOffset(limit)
      } else {
        setReviews(prev => [...prev, ...newReviews])
        setOffset(prev => prev + limit)
      }
      
      setHasMore(newReviews.length === limit)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, limit, offset])

  const refreshReviews = useCallback(() => {
    setOffset(0)
    fetchReviews(true)
  }, [fetchReviews])

  const loadMoreReviews = useCallback(() => {
    if (!loading && hasMore) {
      fetchReviews(false)
    }
  }, [loading, hasMore, fetchReviews])

  useEffect(() => {
    if (userId) {
      fetchReviews(true)
    }
  }, [userId])

  return {
    reviews,
    loading,
    error,
    hasMore,
    refreshReviews,
    loadMoreReviews
  }
}

export const useTaskReviews = (taskId: string) => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const taskReviews = await RatingService.getTaskReviews(taskId)
      setReviews(taskReviews)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    if (taskId) {
      fetchReviews()
    }
  }, [taskId, fetchReviews])

  return {
    reviews,
    loading,
    error,
    refreshReviews: fetchReviews
  }
}

export const useUserReviewStats = (userId: string) => {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const reviewStats = await RatingService.getUserReviewStats(userId)
      setStats(reviewStats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchStats()
    }
  }, [userId, fetchStats])

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  }
}
