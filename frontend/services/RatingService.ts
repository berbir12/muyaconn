import { supabase } from '../lib/supabase'

export interface Review {
  id: string
  task_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  review_type: 'tasker' | 'customer'
  is_public: boolean
  created_at: string
  updated_at: string
  // Additional fields for display
  reviewer_name?: string
  reviewee_name?: string
  task_title?: string
}

export interface ReviewStats {
  average_rating: number
  total_reviews: number
  rating_breakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export class RatingService {
  // Submit a review
  static async submitReview(reviewData: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<Review | null> {
    try {
      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('task_id', reviewData.task_id)
        .eq('reviewer_id', reviewData.reviewer_id)
        .eq('review_type', reviewData.review_type)
        .single()

      if (existingReview) {
        throw new Error('Review already exists for this task')
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select(`
          *,
          profiles!reviews_reviewer_id_fkey(full_name),
          profiles!reviews_reviewee_id_fkey(full_name),
          tasks(title)
        `)
        .single()

      if (error) throw error

      // Update user's rating stats
      await this.updateUserRatingStats(reviewData.reviewee_id)

      return {
        ...data,
        reviewer_name: data.profiles?.full_name,
        reviewee_name: data.profiles?.full_name,
        task_title: data.tasks?.title
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      throw error
    }
  }

  // Get reviews for a user
  static async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_reviewer_id_fkey(full_name),
          profiles!reviews_reviewee_id_fkey(full_name),
          tasks(title)
        `)
        .eq('reviewee_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(review => ({
            ...review,
        reviewer_name: review.profiles?.full_name,
        reviewee_name: review.profiles?.full_name,
        task_title: review.tasks?.title
      }))
    } catch (error) {
      console.error('Error getting user reviews:', error)
      return []
    }
  }

  // Get reviews for a task
  static async getTaskReviews(taskId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_reviewer_id_fkey(full_name),
          profiles!reviews_reviewee_id_fkey(full_name),
          tasks(title)
        `)
        .eq('task_id', taskId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(review => ({
            ...review,
        reviewer_name: review.profiles?.full_name,
        reviewee_name: review.profiles?.full_name,
        task_title: review.tasks?.title
      }))
    } catch (error) {
      console.error('Error getting task reviews:', error)
      return []
    }
  }

  // Get rating stats for a user
  static async getUserRatingStats(userId: string): Promise<ReviewStats> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', userId)
        .eq('is_public', true)

      if (error) throw error

      const ratings = data.map(r => r.rating)
      const totalReviews = ratings.length
      const averageRating = totalReviews > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews : 0

      const ratingBreakdown = {
        5: ratings.filter(r => r === 5).length,
        4: ratings.filter(r => r === 4).length,
        3: ratings.filter(r => r === 3).length,
        2: ratings.filter(r => r === 2).length,
        1: ratings.filter(r => r === 1).length
      }

      return {
        average_rating: Math.round(averageRating * 10) / 10,
        total_reviews: totalReviews,
        rating_breakdown: ratingBreakdown
      }
    } catch (error) {
      console.error('Error getting rating stats:', error)
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    }
  }

  // Update user's rating stats in profiles table
  private static async updateUserRatingStats(userId: string): Promise<void> {
    try {
      const stats = await this.getUserRatingStats(userId)
      
      await supabase
        .from('profiles')
        .update({
          rating_average: stats.average_rating,
          rating_count: stats.total_reviews,
          total_reviews: stats.total_reviews,
          average_rating: stats.average_rating
        })
        .eq('id', userId)
    } catch (error) {
      console.error('Error updating rating stats:', error)
    }
  }

  // Check if user can review a task
  static async canUserReviewTask(taskId: string, userId: string): Promise<boolean> {
    try {
      // Check if task is completed
      const { data: task } = await supabase
        .from('tasks')
        .select('status, customer_id, tasker_id')
        .eq('id', taskId)
        .single()

      if (!task || task.status !== 'completed') {
        return false
      }

      // Check if user is involved in the task
      if (task.customer_id !== userId && task.tasker_id !== userId) {
        return false
      }

      // Check if user already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('task_id', taskId)
        .eq('reviewer_id', userId)
        .single()

      return !existingReview
    } catch (error) {
      console.error('Error checking if user can review:', error)
      return false
    }
  }
}
