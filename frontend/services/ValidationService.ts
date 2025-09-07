export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  message?: string
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  isValid: boolean
  errors: { [key: string]: string }
}

export class ValidationService {
  /**
   * Validate a single field against a rule
   */
  static validateField(value: any, rule: ValidationRule, fieldName: string): string | null {
    // Required check
    if (rule.required && (value === null || value === undefined || value === '')) {
      return rule.message || `${fieldName} is required`
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return null
    }

    // Type conversion for string validations
    const stringValue = String(value)

    // Min length check
    if (rule.minLength && stringValue.length < rule.minLength) {
      return rule.message || `${fieldName} must be at least ${rule.minLength} characters`
    }

    // Max length check
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return rule.message || `${fieldName} must be no more than ${rule.maxLength} characters`
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return rule.message || `${fieldName} format is invalid`
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value)
    }

    return null
  }

  /**
   * Validate an object against a schema
   */
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: { [key: string]: string } = {}
    let isValid = true

    for (const [fieldName, rule] of Object.entries(schema)) {
      const value = data[fieldName]
      const error = this.validateField(value, rule, fieldName)
      
      if (error) {
        errors[fieldName] = error
        isValid = false
      }
    }

    return { isValid, errors }
  }

  /**
   * Common validation rules
   */
  static rules = {
    required: (message?: string): ValidationRule => ({
      required: true,
      message
    }),

    email: (message?: string): ValidationRule => ({
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: message || 'Please enter a valid email address'
    }),

    password: (minLength: number = 6, message?: string): ValidationRule => ({
      required: true,
      minLength,
      message: message || `Password must be at least ${minLength} characters`
    }),

    phone: (message?: string): ValidationRule => ({
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      message: message || 'Please enter a valid phone number'
    }),

    username: (message?: string): ValidationRule => ({
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_]+$/,
      message: message || 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
    }),

    name: (message?: string): ValidationRule => ({
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s]+$/,
      message: message || 'Name must be 2-50 characters and contain only letters and spaces'
    }),

    positiveNumber: (message?: string): ValidationRule => ({
      required: true,
      custom: (value) => {
        const num = Number(value)
        if (isNaN(num) || num <= 0) {
          return message || 'Must be a positive number'
        }
        return null
      }
    }),

    date: (message?: string): ValidationRule => ({
      required: true,
      custom: (value) => {
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          return message || 'Please enter a valid date'
        }
        return null
      }
    }),

    futureDate: (message?: string): ValidationRule => ({
      required: true,
      custom: (value) => {
        const date = new Date(value)
        const now = new Date()
        if (isNaN(date.getTime()) || date <= now) {
          return message || 'Date must be in the future'
        }
        return null
      }
    }),

    url: (message?: string): ValidationRule => ({
      pattern: /^https?:\/\/.+/,
      message: message || 'Please enter a valid URL'
    }),

    minValue: (min: number, message?: string): ValidationRule => ({
      custom: (value) => {
        const num = Number(value)
        if (isNaN(num) || num < min) {
          return message || `Value must be at least ${min}`
        }
        return null
      }
    }),

    maxValue: (max: number, message?: string): ValidationRule => ({
      custom: (value) => {
        const num = Number(value)
        if (isNaN(num) || num > max) {
          return message || `Value must be no more than ${max}`
        }
        return null
      }
    })
  }

  /**
   * Validation schemas for common forms
   */
  static schemas = {
    userRegistration: {
      email: this.rules.email(),
      password: this.rules.password(6),
      full_name: this.rules.name(),
      username: this.rules.username(),
      phone: this.rules.phone()
    },

    userLogin: {
      email: this.rules.email(),
      password: this.rules.required('Password is required')
    },

    taskCreation: {
      title: {
        required: true,
        minLength: 5,
        maxLength: 100,
        message: 'Title must be 5-100 characters'
      },
      description: {
        required: true,
        minLength: 20,
        maxLength: 1000,
        message: 'Description must be 20-1000 characters'
      },
      category_id: this.rules.required('Please select a category'),
      address: {
        required: true,
        minLength: 10,
        maxLength: 200,
        message: 'Address must be 10-200 characters'
      },
      city: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/,
        message: 'City must be 2-50 characters and contain only letters'
      },
      state: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/,
        message: 'State must be 2-50 characters and contain only letters'
      },
      zip_code: {
        required: true,
        pattern: /^\d{5}(-\d{4})?$/,
        message: 'Please enter a valid ZIP code'
      },
      budget: this.rules.positiveNumber('Budget must be a positive number'),
      task_date: this.rules.futureDate('Task date must be in the future'),
      urgency: {
        required: true,
        custom: (value) => {
          const validValues = ['flexible', 'within_week', 'urgent']
          if (!validValues.includes(value)) {
            return 'Please select a valid urgency level'
          }
          return null
        }
      }
    },

    taskApplication: {
      message: {
        required: true,
        minLength: 10,
        maxLength: 500,
        message: 'Message must be 10-500 characters'
      },
      proposed_price: this.rules.positiveNumber('Proposed price must be a positive number'),
      estimated_time: this.rules.positiveNumber('Estimated time must be a positive number'),
      availability_date: this.rules.futureDate('Availability date must be in the future')
    },

    taskerApplication: {
      full_name: this.rules.name(),
      phone: this.rules.phone(),
      date_of_birth: {
        required: true,
        custom: (value) => {
          const date = new Date(value)
          const now = new Date()
          const age = now.getFullYear() - date.getFullYear()
          
          if (isNaN(date.getTime())) {
            return 'Please enter a valid date of birth'
          }
          
          if (age < 18) {
            return 'You must be at least 18 years old'
          }
          
          if (age > 100) {
            return 'Please enter a valid date of birth'
          }
          
          return null
        }
      },
      nationality: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/,
        message: 'Nationality must be 2-50 characters and contain only letters'
      },
      id_number: {
        required: true,
        minLength: 5,
        maxLength: 20,
        message: 'ID number must be 5-20 characters'
      },
      experience: {
        required: true,
        minLength: 10,
        maxLength: 1000,
        message: 'Experience description must be 10-1000 characters'
      },
      skills: {
        required: true,
        custom: (value) => {
          if (!Array.isArray(value) || value.length === 0) {
            return 'Please select at least one skill'
          }
          if (value.length > 10) {
            return 'Please select no more than 10 skills'
          }
          return null
        }
      },
      hourly_rate: this.rules.positiveNumber('Hourly rate must be a positive number')
    },

    review: {
      rating: {
        required: true,
        custom: (value) => {
          const num = Number(value)
          if (isNaN(num) || num < 1 || num > 5) {
            return 'Rating must be between 1 and 5'
          }
          return null
        }
      },
      review_text: {
        required: true,
        minLength: 10,
        maxLength: 500,
        message: 'Review text must be 10-500 characters'
      }
    }
  }

  /**
   * Sanitize input data
   */
  static sanitize(data: any): any {
    if (typeof data === 'string') {
      return data.trim()
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item))
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitize(value)
      }
      return sanitized
    }
    
    return data
  }

  /**
   * Validate and sanitize data
   */
  static validateAndSanitize(data: any, schema: ValidationSchema): ValidationResult {
    const sanitizedData = this.sanitize(data)
    return this.validate(sanitizedData, schema)
  }
}
