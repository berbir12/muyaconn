import { Alert } from 'react-native'

export interface ErrorInfo {
  code?: string
  message: string
  details?: string
  statusCode?: number
  timestamp: string
  context?: string
  userId?: string
}

export interface ErrorHandlerOptions {
  showAlert?: boolean
  logError?: boolean
  retryable?: boolean
  fallbackMessage?: string
  context?: string
}

export class ErrorService {
  private static errorLog: ErrorInfo[] = []
  private static maxLogSize = 100

  /**
   * Handle and process errors consistently
   */
  static handleError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): ErrorInfo {
    const {
      showAlert = true,
      logError = true,
      retryable = false,
      fallbackMessage = 'An unexpected error occurred',
      context = 'Unknown'
    } = options

    const errorInfo = this.parseError(error, context)
    
    if (logError) {
      this.logError(errorInfo)
    }

    if (showAlert) {
      this.showErrorAlert(errorInfo, retryable)
    }

    return errorInfo
  }

  /**
   * Parse different types of errors into a consistent format
   */
  private static parseError(error: any, context: string): ErrorInfo {
    const timestamp = new Date().toISOString()
    
    // Handle different error types
    if (error?.response?.data) {
      // API error response
      return {
        code: error.response.data.code || error.response.status?.toString(),
        message: error.response.data.message || error.response.data.detail || 'API Error',
        details: error.response.data.details,
        statusCode: error.response.status,
        timestamp,
        context
      }
    } else if (error?.message) {
      // Standard Error object
      return {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
        context
      }
    } else if (typeof error === 'string') {
      // String error
      return {
        message: error,
        timestamp,
        context
      }
    } else {
      // Unknown error type
      return {
        message: 'Unknown error occurred',
        details: JSON.stringify(error),
        timestamp,
        context
      }
    }
  }

  /**
   * Log error for debugging and monitoring
   */
  private static logError(errorInfo: ErrorInfo): void {
    // Add to in-memory log
    this.errorLog.unshift(errorInfo)
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // Log to console for development
    console.error('Error logged:', {
      ...errorInfo,
      stack: new Error().stack
    })

    // In production, you would send this to a logging service
    // this.sendToLoggingService(errorInfo)
  }

  /**
   * Show user-friendly error alert
   */
  private static showErrorAlert(errorInfo: ErrorInfo, retryable: boolean = false): void {
    const { title, message, actions } = this.getUserFriendlyError(errorInfo, retryable)
    
    Alert.alert(title, message, actions)
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private static getUserFriendlyError(errorInfo: ErrorInfo, retryable: boolean) {
    const { code, message, statusCode } = errorInfo

    // Network errors
    if (code === 'NETWORK_ERROR' || message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Please check your internet connection and try again.',
        actions: retryable ? [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => {} }
        ] : [{ text: 'OK' }]
      }
    }

    // Authentication errors
    if (statusCode === 401 || message.includes('unauthorized') || message.includes('token')) {
      return {
        title: 'Authentication Error',
        message: 'Please sign in again to continue.',
        actions: [
          { text: 'OK', onPress: () => {} }
        ]
      }
    }

    // Permission errors
    if (statusCode === 403 || message.includes('permission') || message.includes('forbidden')) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        actions: [{ text: 'OK' }]
      }
    }

    // Not found errors
    if (statusCode === 404 || message.includes('not found')) {
      return {
        title: 'Not Found',
        message: 'The requested resource was not found.',
        actions: [{ text: 'OK' }]
      }
    }

    // Validation errors
    if (statusCode === 400 || message.includes('validation') || message.includes('invalid')) {
      return {
        title: 'Invalid Input',
        message: 'Please check your input and try again.',
        actions: [{ text: 'OK' }]
      }
    }

    // Server errors
    if (statusCode >= 500 || message.includes('server error')) {
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        actions: retryable ? [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => {} }
        ] : [{ text: 'OK' }]
      }
    }

    // Rate limiting
    if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
      return {
        title: 'Too Many Requests',
        message: 'Please wait a moment before trying again.',
        actions: [{ text: 'OK' }]
      }
    }

    // Default error
    return {
      title: 'Error',
      message: message || 'An unexpected error occurred',
      actions: retryable ? [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => {} }
      ] : [{ text: 'OK' }]
    }
  }

  /**
   * Handle specific error types with custom logic
   */
  static handleAuthError(error: any): void {
    this.handleError(error, {
      showAlert: true,
      logError: true,
      context: 'Authentication',
      fallbackMessage: 'Authentication failed'
    })
  }

  static handleNetworkError(error: any): void {
    this.handleError(error, {
      showAlert: true,
      logError: true,
      retryable: true,
      context: 'Network',
      fallbackMessage: 'Network connection failed'
    })
  }

  static handleValidationError(error: any): void {
    this.handleError(error, {
      showAlert: true,
      logError: false, // Don't log validation errors
      context: 'Validation',
      fallbackMessage: 'Please check your input'
    })
  }

  static handleDatabaseError(error: any): void {
    this.handleError(error, {
      showAlert: true,
      logError: true,
      context: 'Database',
      fallbackMessage: 'Database operation failed'
    })
  }

  static handlePaymentError(error: any): void {
    this.handleError(error, {
      showAlert: true,
      logError: true,
      context: 'Payment',
      fallbackMessage: 'Payment processing failed'
    })
  }

  /**
   * Get error logs for debugging
   */
  static getErrorLogs(): ErrorInfo[] {
    return [...this.errorLog]
  }

  /**
   * Clear error logs
   */
  static clearErrorLogs(): void {
    this.errorLog = []
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: any): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED']
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
    
    if (error?.code && retryableCodes.includes(error.code)) {
      return true
    }
    
    if (error?.statusCode && retryableStatusCodes.includes(error.statusCode)) {
      return true
    }
    
    if (error?.message) {
      const retryableMessages = ['network', 'timeout', 'connection', 'server error']
      return retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg)
      )
    }
    
    return false
  }

  /**
   * Create a retry mechanism
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          throw error
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
    
    throw lastError
  }

  /**
   * Show success message
   */
  static showSuccess(title: string, message: string): void {
    Alert.alert(title, message, [{ text: 'OK' }])
  }

  /**
   * Show warning message
   */
  static showWarning(title: string, message: string): void {
    Alert.alert(title, message, [{ text: 'OK' }])
  }

  /**
   * Show info message
   */
  static showInfo(title: string, message: string): void {
    Alert.alert(title, message, [{ text: 'OK' }])
  }
}
