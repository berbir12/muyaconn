import { supabase } from '../lib/supabase'

export interface Review {
  id: string
  task_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  review_text?: string
  review_type?: 'tasker_to_customer' | 'customer_to_tasker'
  is_public?: boolean
  created_at: string
  updated_at?: string
  
  // Joined data
  reviewer_profile?: {
    full_name: string
    username: string
    avatar_url?: string
  }
  reviewee_profile?: {
    full_name: string
    username: string
    avatar_url?: string
  }
  task?: {
    title: string
    category_id: string
  }
  criteria?: ReviewCriteria[]
  response?: ReviewResponse
  likes_count?: number
  user_like?: boolean
}

export interface ReviewCriteria {
  id: string
  review_id: string
  criteria_name: string
  rating: number
  created_at: string
}

export interface ReviewResponse {
  id: string
  review_id: string
  responder_id: string
  response_text: string
  created_at: string
  updated_at: string
  
  // Joined data
  responder_profile?: {
    full_name: string
    username: string
    avatar_url?: string
  }
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_distribution: {
    '5_star': number
    '4_star': number
    '3_star': number
    '2_star': number
    '1_star': number
  }
}

export interface CreateReviewData {
  task_id: string
  reviewee_id: string
  rating: number
  review_text?: string
  review_type: 'tasker_to_customer' | 'customer_to_tasker'
  criteria?: Array<{
    criteria_name: string
    rating: number
  }>
}

export class RatingService {
  /**
   * Get reviews for a specific user
   */
  static async getUserReviews(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer_profile:profiles!reviewer_id (full_name, username, avatar_url),
          reviewee_profile:profiles!reviewee_id (full_name, username, avatar_url),
          task:tasks (title, category_id),
          criteria:review_criteria (*),
          response:review_responses (
            *,
            responder_profile:profiles!responder_id (full_name, username, avatar_url)
          )
        `)
        .eq('reviewee_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      // Get likes count for each review
      const reviewsWithLikes = await Promise.all(
        (data || []).map(async (review) => {
          const { count } = await supabase
            .from('review_likes')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', review.id)
            .eq('is_helpful', true)

          return {
            ...review,
            likes_count: count || 0
          }
        })
      )

      return reviewsWithLikes
    } catch (error: any) {
      console.error('Error fetching user reviews:', error)
      throw new Error(`Failed to fetch reviews: ${error.message}`)
    }
  }

  /**
   * Get reviews for a specific task
   */
  static async getTaskReviews(taskId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer_profile:profiles!reviewer_id (full_name, username, avatar_url),
          reviewee_profile:profiles!reviewee_id (full_name, username, avatar_url),
          criteria:review_criteria (*),
          response:review_responses (
            *,
            responder_profile:profiles!responder_id (full_name, username, avatar_url)
          )
        `)
        .eq('task_id', taskId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get likes count for each review
      const reviewsWithLikes = await Promise.all(
        (data || []).map(async (review) => {
          const { count } = await supabase
            .from('review_likes')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', review.id)
            .eq('is_helpful', true)

          return {
            ...review,
            likes_count: count || 0
          }
        })
      )

      return reviewsWithLikes
    } catch (error: any) {
      console.error('Error fetching task reviews:', error)
      throw new Error(`Failed to fetch task reviews: ${error.message}`)
    }
  }

  /**
   * Create a new review
   */
  static async createReview(reviewData: CreateReviewData): Promise<Review> {
    try {
      // First check if user can review this task
      const { data: canReview, error: checkError } = await supabase
        .rpc('can_user_review_task', {
          p_user_id: (await supabase.auth.getUser()).data.user?.id,
          p_task_id: reviewData.task_id,
          p_review_type: reviewData.review_type
        })

      if (checkError) throw checkError
      if (!canReview) {
        throw new Error('You cannot review this task')
      }

      // Create the review
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          task_id: reviewData.task_id,
          reviewee_id: reviewData.reviewee_id,
          rating: reviewData.rating,
          review_text: reviewData.review_text,
          review_type: reviewData.review_type || 'customer_to_tasker'
        })
        .select()
        .single()

      if (reviewError) throw reviewError

      // Add criteria if provided
      if (reviewData.criteria && reviewData.criteria.length > 0) {
        const criteriaData = reviewData.criteria.map(criteria => ({
          review_id: review.id,
          criteria_name: criteria.criteria_name,
          rating: criteria.rating
        }))

        const { error: criteriaError } = await supabase
          .from('review_criteria')
          .insert(criteriaData)

        if (criteriaError) {
          console.warn('Failed to add review criteria:', criteriaError)
        }
      }

      // Fetch the complete review with joined data
      const { data: completeReview, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer_profile:profiles!reviewer_id (full_name, username, avatar_url),
          reviewee_profile:profiles!reviewee_id (full_name, username, avatar_url),
          task:tasks (title, category_id),
          criteria:review_criteria (*)
        `)
        .eq('id', review.id)
        .single()

      if (fetchError) throw fetchError

      return completeReview
    } catch (error: any) {
      console.error('Error creating review:', error)
      throw new Error(`Failed to create review: ${error.message}`)
    }
  }

  /**
   * Update an existing review
   */
  static async updateReview(
    reviewId: string, 
    updates: Partial<CreateReviewData>
  ): Promise<Review> {
    try {
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .update({
          rating: updates.rating,
          review_text: updates.review_text,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select()
        .single()

      if (reviewError) throw reviewError

      // Update criteria if provided
      if (updates.criteria && updates.criteria.length > 0) {
        // Delete existing criteria
        await supabase
          .from('review_criteria')
          .delete()
          .eq('review_id', reviewId)

        // Insert new criteria
        const criteriaData = updates.criteria.map(criteria => ({
          review_id: reviewId,
          criteria_name: criteria.criteria_name,
          rating: criteria.rating
        }))

        const { error: criteriaError } = await supabase
          .from('review_criteria')
          .insert(criteriaData)

        if (criteriaError) {
          console.warn('Failed to update review criteria:', criteriaError)
        }
      }

      // Fetch the complete review with joined data
      const { data: completeReview, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer_profile:profiles!reviewer_id (full_name, username, avatar_url),
          reviewee_profile:profiles!reviewee_id (full_name, username, avatar_url),
          task:tasks (title, category_id),
          criteria:review_criteria (*)
        `)
        .eq('id', reviewId)
        .single()

      if (fetchError) throw fetchError

      return completeReview
    } catch (error: any) {
      console.error('Error updating review:', error)
      throw new Error(`Failed to update review: ${error.message}`)
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error deleting review:', error)
      throw new Error(`Failed to delete review: ${error.message}`)
    }
  }

  /**
   * Add a response to a review
   */
  static async addReviewResponse(
    reviewId: string, 
    responseText: string
  ): Promise<ReviewResponse> {
    try {
      const { data: response, error } = await supabase
        .from('review_responses')
        .insert({
          review_id: reviewId,
          response_text: responseText
        })
        .select(`
          *,
          responder_profile:profiles!responder_id (full_name, username, avatar_url)
        `)
        .single()

      if (error) throw error
      return response
    } catch (error: any) {
      console.error('Error adding review response:', error)
      throw new Error(`Failed to add review response: ${error.message}`)
    }
  }

  /**
   * Like or unlike a review
   */
  static async toggleReviewLike(reviewId: string, isHelpful: boolean): Promise<void> {
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('User not authenticated')

      // Check if like already exists
      const { data: existingLike } = await supabase
        .from('review_likes')
        .select('id, is_helpful')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single()

      if (existingLike) {
        if (existingLike.is_helpful === isHelpful) {
          // Remove the like
          await supabase
            .from('review_likes')
            .delete()
            .eq('review_id', reviewId)
            .eq('user_id', user.id)
        } else {
          // Update the like
          await supabase
            .from('review_likes')
            .update({ is_helpful })
            .eq('review_id', reviewId)
            .eq('user_id', user.id)
        }
      } else {
        // Create new like
        await supabase
          .from('review_likes')
          .insert({
            review_id: reviewId,
            is_helpful
          })
      }
    } catch (error: any) {
      console.error('Error toggling review like:', error)
      throw new Error(`Failed to toggle review like: ${error.message}`)
    }
  }

  /**
   * Get review statistics for a user
   */
  static async getUserReviewStats(userId: string): Promise<ReviewStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_review_stats', { user_id: userId })

      if (error) throw error

      return data[0] || {
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: {
          '5_star': 0,
          '4_star': 0,
          '3_star': 0,
          '2_star': 0,
          '1_star': 0
        }
      }
    } catch (error: any) {
      console.error('Error fetching review stats:', error)
      throw new Error(`Failed to fetch review stats: ${error.message}`)
    }
  }

  /**
   * Check if user can review a task
   */
  static async canUserReviewTask(
    taskId: string, 
    reviewType: 'tasker_to_customer' | 'customer_to_tasker'
  ): Promise<boolean> {
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return false

      const { data, error } = await supabase
        .rpc('can_user_review_task', {
          p_user_id: user.id,
          p_task_id: taskId,
          p_review_type: reviewType
        })

      if (error) throw error
      return data || false
    } catch (error: any) {
      console.error('Error checking review eligibility:', error)
      return false
    }
  }
}
