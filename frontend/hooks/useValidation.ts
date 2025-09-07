import { useState, useCallback } from 'react'
import { ValidationService, ValidationSchema, ValidationResult } from '../services/ValidationService'

export interface UseValidationOptions {
  schema: ValidationSchema
  initialData?: any
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export function useValidation(options: UseValidationOptions) {
  const { schema, initialData = {}, validateOnChange = false, validateOnBlur = true } = options
  
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [isValid, setIsValid] = useState(false)

  /**
   * Validate all fields
   */
  const validateAll = useCallback((): ValidationResult => {
    const result = ValidationService.validate(data, schema)
    setErrors(result.errors)
    setIsValid(result.isValid)
    return result
  }, [data, schema])

  /**
   * Validate a specific field
   */
  const validateField = useCallback((fieldName: string, value?: any) => {
    const fieldValue = value !== undefined ? value : data[fieldName]
    const rule = schema[fieldName]
    
    if (!rule) return null

    const error = ValidationService.validateField(fieldValue, rule, fieldName)
    
    setErrors(prev => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[fieldName] = error
      } else {
        delete newErrors[fieldName]
      }
      return newErrors
    })

    // Update overall validity
    const allErrors = { ...errors }
    if (error) {
      allErrors[fieldName] = error
    } else {
      delete allErrors[fieldName]
    }
    setIsValid(Object.keys(allErrors).length === 0)

    return error
  }, [data, schema, errors])

  /**
   * Update field value
   */
  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setData(prev => ({ ...prev, [fieldName]: value }))
    
    if (validateOnChange) {
      validateField(fieldName, value)
    }
  }, [validateField, validateOnChange])

  /**
   * Handle field blur
   */
  const handleFieldBlur = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    
    if (validateOnBlur) {
      validateField(fieldName)
    }
  }, [validateField, validateOnBlur])

  /**
   * Handle field change
   */
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFieldValue(fieldName, value)
  }, [setFieldValue])

  /**
   * Reset form
   */
  const reset = useCallback((newData?: any) => {
    setData(newData || initialData)
    setErrors({})
    setTouched({})
    setIsValid(false)
  }, [initialData])

  /**
   * Set multiple field values
   */
  const setValues = useCallback((newData: any) => {
    setData(prev => ({ ...prev, ...newData }))
    
    if (validateOnChange) {
      // Validate all fields when setting multiple values
      setTimeout(() => validateAll(), 0)
    }
  }, [validateOnChange, validateAll])

  /**
   * Get field error
   */
  const getFieldError = useCallback((fieldName: string) => {
    return errors[fieldName] || null
  }, [errors])

  /**
   * Check if field has been touched
   */
  const isFieldTouched = useCallback((fieldName: string) => {
    return touched[fieldName] || false
  }, [touched])

  /**
   * Check if field has error
   */
  const hasFieldError = useCallback((fieldName: string) => {
    return !!(errors[fieldName] && touched[fieldName])
  }, [errors, touched])

  /**
   * Get all field errors
   */
  const getAllErrors = useCallback(() => {
    return errors
  }, [errors])

  /**
   * Check if form is valid
   */
  const isFormValid = useCallback(() => {
    return isValid
  }, [isValid])

  /**
   * Submit form with validation
   */
  const submit = useCallback((onSubmit: (data: any) => void) => {
    const result = validateAll()
    
    if (result.isValid) {
      onSubmit(data)
    }
    
    return result
  }, [data, validateAll])

  return useMemo(() => ({
    data,
    errors,
    touched,
    isValid,
    setFieldValue,
    handleFieldChange,
    handleFieldBlur,
    validateField,
    validateAll,
    reset,
    setValues,
    getFieldError,
    isFieldTouched,
    hasFieldError,
    getAllErrors,
    isFormValid,
    submit
  }), [data, errors, touched, isValid, setFieldValue, handleFieldChange, handleFieldBlur, validateField, validateAll, reset, setValues, getFieldError, isFieldTouched, hasFieldError, getAllErrors, isFormValid, submit])
}

/**
 * Hook for form validation with async operations
 */
export function useFormValidation<T = any>(
  schema: ValidationSchema,
  onSubmit: (data: any) => Promise<T>,
  options: {
    initialData?: any
    validateOnChange?: boolean
    validateOnBlur?: boolean
    onSuccess?: (result: T) => void
    onError?: (error: any) => void
  } = {}
) {
  const {
    initialData = {},
    validateOnChange = false,
    validateOnBlur = true,
    onSuccess,
    onError
  } = options

  const validation = useValidation({
    schema,
    initialData,
    validateOnChange,
    validateOnBlur
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    
    try {
      const result = validation.submit(async (data) => {
        const response = await onSubmit(data)
        onSuccess?.(response)
        return response
      })
      
      if (!result.isValid) {
        onError?.(new Error('Validation failed'))
      }
      
      return result
    } catch (error) {
      onError?.(error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [validation, onSubmit, onSuccess, onError])

  return useMemo(() => ({
    ...validation,
    isSubmitting,
    handleSubmit
  }), [validation, isSubmitting, handleSubmit])
}
