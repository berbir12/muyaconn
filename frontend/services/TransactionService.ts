import { supabase } from '../lib/supabase'

export interface TransactionOperation {
  table: string
  operation: 'insert' | 'update' | 'delete'
  data?: any
  filters?: Record<string, any>
  select?: string
}

export interface TransactionResult {
  success: boolean
  data?: any
  error?: string
}

export class TransactionService {
  /**
   * Execute multiple database operations in a transaction
   * Note: Supabase doesn't support true transactions, so we'll implement
   * a rollback mechanism using a series of operations with error handling
   */
  static async executeTransaction(
    operations: TransactionOperation[],
    rollbackOperations?: TransactionOperation[]
  ): Promise<TransactionResult> {
    const results: any[] = []
    const executedOperations: TransactionOperation[] = []

    try {
      // Execute each operation in sequence
      for (const operation of operations) {
        const result = await this.executeOperation(operation)
        
        if (!result.success) {
          // If any operation fails, rollback all previous operations
          await this.rollbackOperations(executedOperations, rollbackOperations)
          return {
            success: false,
            error: result.error || 'Transaction failed'
          }
        }
        
        results.push(result.data)
        executedOperations.push(operation)
      }

      return {
        success: true,
        data: results
      }
    } catch (error: any) {
      // Rollback on any unexpected error
      await this.rollbackOperations(executedOperations, rollbackOperations)
      return {
        success: false,
        error: error.message || 'Transaction failed with unexpected error'
      }
    }
  }

  /**
   * Execute a single database operation
   */
  private static async executeOperation(operation: TransactionOperation): Promise<TransactionResult> {
    try {
      let query = supabase.from(operation.table)

      switch (operation.operation) {
        case 'insert':
          query = query.insert(operation.data)
          break
        case 'update':
          query = query.update(operation.data)
          if (operation.filters) {
            Object.entries(operation.filters).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          break
        case 'delete':
          if (operation.filters) {
            Object.entries(operation.filters).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          query = query.delete()
          break
      }

      if (operation.select) {
        query = query.select(operation.select)
      }

      const { data, error } = await query

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Rollback executed operations
   */
  private static async rollbackOperations(
    executedOperations: TransactionOperation[],
    rollbackOperations?: TransactionOperation[]
  ): Promise<void> {
    try {
      // If custom rollback operations are provided, use them
      if (rollbackOperations) {
        for (const operation of rollbackOperations) {
          await this.executeOperation(operation)
        }
        return
      }

      // Otherwise, reverse the executed operations
      for (let i = executedOperations.length - 1; i >= 0; i--) {
        const operation = executedOperations[i]
        const rollbackOperation = this.createRollbackOperation(operation)
        if (rollbackOperation) {
          await this.executeOperation(rollbackOperation)
        }
      }
    } catch (error) {
      console.error('Error during rollback:', error)
      // Don't throw here as we're already in an error state
    }
  }

  /**
   * Create a rollback operation for a given operation
   */
  private static createRollbackOperation(operation: TransactionOperation): TransactionOperation | null {
    switch (operation.operation) {
      case 'insert':
        // For inserts, we need to delete the inserted record
        // This requires the inserted record's ID, which we'd need to track
        return null // Cannot automatically rollback inserts without ID tracking
      
      case 'update':
        // For updates, we'd need to store the original values
        // This is complex and would require more sophisticated tracking
        return null
      
      case 'delete':
        // For deletes, we'd need to restore the deleted record
        // This is also complex and would require storing the deleted data
        return null
      
      default:
        return null
    }
  }

  /**
   * Accept a task application with proper transaction handling
   */
  static async acceptTaskApplication(
    applicationId: string,
    taskId: string,
    taskerId: string,
    customerId: string
  ): Promise<TransactionResult> {
    const operations: TransactionOperation[] = [
      {
        table: 'task_applications',
        operation: 'update',
        data: { status: 'accepted' },
        filters: { id: applicationId }
      },
      {
        table: 'tasks',
        operation: 'update',
        data: { 
          status: 'in_progress',
          tasker_id: taskerId,
          updated_at: new Date().toISOString()
        },
        filters: { id: taskId }
      },
      {
        table: 'chats',
        operation: 'insert',
        data: {
          task_id: taskId,
          customer_id: customerId,
          tasker_id: taskerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ]

    // Custom rollback operations
    const rollbackOperations: TransactionOperation[] = [
      {
        table: 'task_applications',
        operation: 'update',
        data: { status: 'pending' },
        filters: { id: applicationId }
      },
      {
        table: 'tasks',
        operation: 'update',
        data: { 
          status: 'open',
          tasker_id: null,
          updated_at: new Date().toISOString()
        },
        filters: { id: taskId }
      },
      {
        table: 'chats',
        operation: 'delete',
        filters: { 
          task_id: taskId,
          customer_id: customerId,
          tasker_id: taskerId
        }
      }
    ]

    return await this.executeTransaction(operations, rollbackOperations)
  }

  /**
   * Complete a task with proper transaction handling
   */
  static async completeTask(
    taskId: string,
    completionData?: {
      customer_rating?: number
      customer_review?: string
      completion_notes?: string
    }
  ): Promise<TransactionResult> {
    try {
      // First, get the task details to find the tasker
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('tasker_id, customer_id, budget')
        .eq('id', taskId)
        .single()

      if (taskError) {
        return {
          success: false,
          error: `Failed to fetch task: ${taskError.message}`
        }
      }

      if (!task.tasker_id) {
        return {
          success: false,
          error: 'Task has no assigned tasker'
        }
      }

      const operations: TransactionOperation[] = [
        {
          table: 'tasks',
          operation: 'update',
          data: { 
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...completionData
          },
          filters: { id: taskId }
        }
      ]

      // Get current tasker profile to increment counters
      const { data: taskerProfile, error: taskerError } = await supabase
        .from('profiles')
        .select('completed_tasks, total_tasks_completed')
        .eq('id', task.tasker_id)
        .single()

      if (!taskerError && taskerProfile) {
        // Update tasker's completed tasks count
        operations.push({
          table: 'profiles',
          operation: 'update',
          data: { 
            completed_tasks: (taskerProfile.completed_tasks || 0) + 1,
            total_tasks_completed: (taskerProfile.total_tasks_completed || 0) + 1,
            updated_at: new Date().toISOString()
          },
          filters: { id: task.tasker_id }
        })
      }

      // If there's a customer rating, update the tasker's rating
      if (completionData?.customer_rating) {
        // Get current rating data
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('rating_average, rating_count, total_reviews')
          .eq('id', task.tasker_id)
          .single()

        if (!profileError && currentProfile) {
          const currentAverage = currentProfile.rating_average || 0
          const currentCount = currentProfile.rating_count || 0
          const currentReviews = currentProfile.total_reviews || 0

          // Calculate new average rating
          const newCount = currentCount + 1
          const newAverage = ((currentAverage * currentCount) + completionData.customer_rating) / newCount

          operations.push({
            table: 'profiles',
            operation: 'update',
            data: { 
              rating_average: Math.round(newAverage * 100) / 100, // Round to 2 decimal places
              rating_count: newCount,
              total_reviews: currentReviews + 1,
              updated_at: new Date().toISOString()
            },
            filters: { id: task.tasker_id }
          })
        }
      }

      // Note: Chat cleanup is handled separately by ChatCleanupService
      // as it's not critical to the task completion transaction

      return await this.executeTransaction(operations)
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to complete task'
      }
    }
  }

  /**
   * Cancel a task with proper transaction handling
   */
  static async cancelTask(
    taskId: string,
    cancellationReason?: string
  ): Promise<TransactionResult> {
    const operations: TransactionOperation[] = [
      {
        table: 'tasks',
        operation: 'update',
        data: { 
          status: 'cancelled',
          tasker_id: null,
          updated_at: new Date().toISOString(),
          cancellation_reason: cancellationReason
        },
        filters: { id: taskId }
      },
      {
        table: 'task_applications',
        operation: 'update',
        data: { status: 'cancelled' },
        filters: { task_id: taskId }
      }
    ]

    return await this.executeTransaction(operations)
  }

  /**
   * Create a tasker application with proper transaction handling
   */
  static async createTaskerApplication(
    userId: string,
    applicationData: any
  ): Promise<TransactionResult> {
    const operations: TransactionOperation[] = [
      {
        table: 'tasker_applications',
        operation: 'insert',
        data: {
          user_id: userId,
          status: 'pending',
          ...applicationData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ]

    return await this.executeTransaction(operations)
  }

  /**
   * Create a review with proper transaction handling
   */
  static async createReview(
    reviewData: any,
    criteriaData?: any[]
  ): Promise<TransactionResult> {
    const operations: TransactionOperation[] = [
      {
        table: 'reviews',
        operation: 'insert',
        data: {
          ...reviewData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ]

    // Add criteria if provided
    if (criteriaData && criteriaData.length > 0) {
      operations.push({
        table: 'review_criteria',
        operation: 'insert',
        data: criteriaData
      })
    }

    return await this.executeTransaction(operations)
  }
}
