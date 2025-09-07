import { useState, useCallback } from 'react'
import { ErrorService } from '../services/ErrorService'

export interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: string | null
  success: boolean
}

export interface AsyncOperationOptions {
  showErrorAlert?: boolean
  logError?: boolean
  retryable?: boolean
  context?: string
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  onFinally?: () => void
}

export function useAsyncOperation<T = any>(
  initialState: T | null = null,
  options: AsyncOperationOptions = {}
) {
  const {
    showErrorAlert = true,
    logError = true,
    retryable = false,
    context = 'AsyncOperation',
    onSuccess,
    onError,
    onFinally
  } = options

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialState,
    loading: false,
    error: null,
    success: false
  })

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false
    }))

    try {
      const result = await operation()
      
      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        success: true,
        error: null
      }))

      onSuccess?.(result)
      return result
    } catch (error: any) {
      const errorInfo = ErrorService.handleError(error, {
        showAlert: showErrorAlert,
        logError,
        retryable,
        context
      })

      setState(prev => ({
        ...prev,
        loading: false,
        success: false,
        error: errorInfo.message
      }))

      onError?.(error)
      throw error
    } finally {
      setState(prev => ({
        ...prev,
        loading: false
      }))
      
      onFinally?.()
    }
  }, [showErrorAlert, logError, retryable, context, onSuccess, onError, onFinally])

  const executeWithRetry = useCallback(async (
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false
    }))

    try {
      const result = await ErrorService.withRetry(operation, maxRetries, delay)
      
      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        success: true,
        error: null
      }))

      onSuccess?.(result)
      return result
    } catch (error: any) {
      const errorInfo = ErrorService.handleError(error, {
        showAlert: showErrorAlert,
        logError,
        retryable: false, // Already retried
        context
      })

      setState(prev => ({
        ...prev,
        loading: false,
        success: false,
        error: errorInfo.message
      }))

      onError?.(error)
      throw error
    } finally {
      setState(prev => ({
        ...prev,
        loading: false
      }))
      
      onFinally?.()
    }
  }, [showErrorAlert, logError, context, onSuccess, onError, onFinally])

  const reset = useCallback(() => {
    setState({
      data: initialState,
      loading: false,
      error: null,
      success: false
    })
  }, [initialState])

  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
      error: null
    }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      success: false
    }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading
    }))
  }, [])

  return {
    ...state,
    execute,
    executeWithRetry,
    reset,
    setData,
    setError,
    setLoading
  }
}

/**
 * Hook for handling form submissions with loading and error states
 */
export function useFormSubmission<T = any>(
  submitFunction: (data: any) => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const asyncOp = useAsyncOperation<T>(null, {
    showErrorAlert: true,
    logError: true,
    context: 'FormSubmission',
    ...options
  })

  const submit = useCallback(async (formData: any) => {
    return await asyncOp.execute(() => submitFunction(formData))
  }, [asyncOp, submitFunction])

  return {
    ...asyncOp,
    submit
  }
}

/**
 * Hook for handling data fetching with loading and error states
 */
export function useDataFetching<T = any>(
  fetchFunction: () => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const asyncOp = useAsyncOperation<T>(null, {
    showErrorAlert: false, // Don't show alerts for data fetching
    logError: true,
    context: 'DataFetching',
    ...options
  })

  const fetch = useCallback(async () => {
    return await asyncOp.execute(fetchFunction)
  }, [asyncOp, fetchFunction])

  const fetchWithRetry = useCallback(async (maxRetries: number = 3) => {
    return await asyncOp.executeWithRetry(fetchFunction, maxRetries)
  }, [asyncOp, fetchFunction])

  return {
    ...asyncOp,
    fetch,
    fetchWithRetry
  }
}
