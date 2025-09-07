import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/Design'
import AnimatedButton from '../components/AnimatedButton'
import NotificationButton from '../components/NotificationButton'

// Task sizes removed - clients now set their own budget

export default function PostTask() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [address, setAddress] = useState('')
  const [subcity, setSubcity] = useState('')
  const [budget, setBudget] = useState('')
  const [taskDate, setTaskDate] = useState('')
  const [taskTime, setTaskTime] = useState('09:00')
  
  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [touched, setTouched] = useState<{[key: string]: boolean}>({})
  
  // Addis Ababa subcities
  const subcities = [
    'Addis Ketema', 'Akaki-Kaliti', 'Arada', 'Bole', 'Gullele', 
    'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 
    'Yeka', 'Lemi Kura', 'Bole Sub-City'
  ]
  
  // Time input - users will type their preferred time
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Categories
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Load categories
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true)
      
      // Try to load categories from database
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.log('Database categories not available, using fallback categories')
        // Use fallback categories if database is not available
        const fallbackCategories = [
          {
            id: 'general-fallback',
            name: 'General',
            slug: 'general',
            description: 'Any type of task or service',
            icon: 'grid-outline',
            color: '#6B7280',
            is_active: true,
            sort_order: 0
          },
          {
            id: 'mounting-fallback',
            name: 'Mounting & Installation',
            slug: 'mounting-installation',
            description: 'TV mounting, furniture assembly, and installation services',
            icon: 'hammer-outline',
            color: '#3B82F6',
            is_active: true,
            sort_order: 1
          },
          {
            id: 'furniture-fallback',
            name: 'Furniture Assembly',
            slug: 'furniture-assembly',
            description: 'IKEA and furniture assembly services',
            icon: 'hammer-outline',
            color: '#10B981',
            is_active: true,
            sort_order: 2
          },
          {
            id: 'moving-fallback',
            name: 'Moving Help',
            slug: 'moving-help',
            description: 'Packing, loading, and moving assistance',
            icon: 'car-outline',
            color: '#F59E0B',
            is_active: true,
            sort_order: 3
          },
          {
            id: 'cleaning-fallback',
            name: 'Cleaning',
            slug: 'cleaning',
            description: 'House cleaning and deep cleaning services',
            icon: 'sparkles-outline',
            color: '#8B5CF6',
            is_active: true,
            sort_order: 4
          },
          {
            id: 'delivery-fallback',
            name: 'Delivery',
            slug: 'delivery',
            description: 'Pickup and delivery services',
            icon: 'bicycle-outline',
            color: '#06B6D4',
            is_active: true,
            sort_order: 5
          }
        ]
        
        setCategories(fallbackCategories)
        if (!categoryId) {
          setCategoryId('general-fallback')
        }
        return
      }
      
      // If database categories exist, use them
      if (data && data.length > 0) {
        // Check if General category exists in the database
        const generalCategory = data.find(cat => cat.slug === 'general')
        if (generalCategory) {
          // General category exists, use it as first
          const otherCategories = data.filter(cat => cat.slug !== 'general')
          setCategories([generalCategory, ...otherCategories])
          // Set General as default if no category is selected
          if (!categoryId) {
            setCategoryId(generalCategory.id)
          }
        } else {
          // General category doesn't exist, use first available
          setCategories(data)
          if (!categoryId) {
            setCategoryId(data[0].id)
          }
        }
      } else {
        // If no categories exist in database, use fallback
        console.log('No categories in database, using fallback categories')
        const fallbackCategories = [
          {
            id: 'general-fallback',
            name: 'General',
            slug: 'general',
            description: 'Any type of task or service',
            icon: 'grid-outline',
            color: '#6B7280',
            is_active: true,
            sort_order: 0
          }
        ]
        setCategories(fallbackCategories)
        if (!categoryId) {
          setCategoryId('general-fallback')
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      // Use minimal fallback on error
      const fallbackCategories = [
        {
          id: 'general-fallback',
          name: 'General',
          slug: 'general',
          description: 'Any type of task or service',
          icon: 'grid-outline',
          color: '#6B7280',
          is_active: true,
          sort_order: 0
        }
      ]
      setCategories(fallbackCategories)
      if (!categoryId) {
        setCategoryId('general-fallback')
      }
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    const dateString = date.toISOString().split('T')[0]
    setTaskDate(dateString)
    setTouched({ ...touched, taskDate: true })
    validateField('taskDate', dateString)
    setShowCalendar(false)
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleSubmit = async () => {
    if (!profile) {
      Alert.alert('Error', 'Please log in to post a task')
      return
    }

    // Enhanced validation with better error messages
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please enter a task title to help taskers understand what you need.')
      return
    }
    if (title.trim().length < 10) {
      Alert.alert('Title Too Short', 'Please provide a more descriptive title (at least 10 characters).')
      return
    }
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please describe your task in detail to help taskers understand the requirements.')
      return
    }
    if (description.trim().length < 20) {
      Alert.alert('Description Too Short', 'Please provide more details about your task (at least 20 characters).')
      return
    }
    if (!categoryId) {
      Alert.alert('Category Required', 'Please select a category to help taskers find your task.')
      return
    }
    if (!address.trim()) {
      Alert.alert('Location Required', 'Please enter the address where the task will be performed.')
      return
    }
    if (!subcity) {
      Alert.alert('Location Required', 'Please select a subcity in Addis Ababa.')
      return
    }
    if (!budget.trim()) {
      Alert.alert('Budget Required', 'Please enter your budget for this task.')
      return
    }
    if (isNaN(Number(budget)) || Number(budget) <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid budget amount (numbers only, greater than 0).')
      return
    }
    if (Number(budget) < 50) {
      Alert.alert('Budget Too Low', 'Please enter a budget of at least ETB 50.')
      return
    }
    if (!taskDate) {
      Alert.alert('Date Required', 'Please select when you need this task completed.')
      return
    }
    if (!taskTime.trim()) {
      Alert.alert('Time Required', 'Please enter the preferred time for this task.')
      return
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(taskDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      Alert.alert('Invalid Date', 'Please select a date in the future.')
      return
    }

    try {
      setLoading(true)

      // Validate category ID
      if (!categoryId) {
        throw new Error('Please select a category for your task.')
      }
      
      // Ensure the category ID is valid
      const selectedCategory = categories.find(cat => cat.id === categoryId)
      if (!selectedCategory) {
        throw new Error('Selected category is not valid. Please refresh and try again.')
      }
      
      // Handle fallback categories - convert to a valid database category
      let finalCategoryId = categoryId
      if (categoryId.includes('-fallback')) {
        // For fallback categories, we'll need to create the category in the database first
        // For now, we'll use a default approach
        console.log('Using fallback category, will need to create in database')
        // You can either create the category here or use a default existing one
        // For now, let's use the first available real category or create a general one
        finalCategoryId = 'general-fallback' // This will need to be handled in the backend
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          customer_id: profile.id,
          category_id: finalCategoryId,
          title: title.trim(),
          description: description.trim(),
          address: address.trim(),
          city: 'Addis Ababa',
          state: 'Addis Ababa',
          zip_code: subcity, // Using subcity as identifier
          task_size: 'medium', // Default size since we removed the selection
          budget: Number(budget),
          task_date: taskDate,
          task_time: taskTime,
          urgency: 'flexible', // Default urgency
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      Alert.alert('Success', 'Task posted successfully!', [
        { text: 'OK', onPress: () => router.push('/jobs') }
      ])
    } catch (error) {
      console.error('Error creating task:', error)
      Alert.alert('Error', 'Failed to create task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Validation functions
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Title is required'
        } else if (value.trim().length < 10) {
          newErrors.title = 'Title must be at least 10 characters'
        } else {
          delete newErrors.title
        }
        break
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required'
        } else if (value.trim().length < 20) {
          newErrors.description = 'Description must be at least 20 characters'
        } else {
          delete newErrors.description
        }
        break
      case 'budget':
        if (!value.trim()) {
          newErrors.budget = 'Budget is required'
        } else if (isNaN(Number(value)) || Number(value) <= 0) {
          newErrors.budget = 'Please enter a valid amount'
        } else if (Number(value) < 50) {
          newErrors.budget = 'Minimum budget is ETB 50'
        } else {
          delete newErrors.budget
        }
        break
      case 'address':
        if (!value.trim()) {
          newErrors.address = 'Address is required'
        } else {
          delete newErrors.address
        }
        break
      case 'taskDate':
        if (!value) {
          newErrors.taskDate = 'Date is required'
        } else {
          const selectedDate = new Date(value)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (selectedDate < today) {
            newErrors.taskDate = 'Please select a future date'
          } else {
            delete newErrors.taskDate
          }
        }
        break
      case 'taskTime':
        if (!value.trim()) {
          newErrors.taskTime = 'Time is required'
        } else {
          delete newErrors.taskTime
        }
        break
      case 'categoryId':
        if (!value) {
          newErrors.categoryId = 'Category is required'
        } else {
          delete newErrors.categoryId
        }
        break
      case 'subcity':
        if (!value) {
          newErrors.subcity = 'Subcity is required'
        } else {
          delete newErrors.subcity
        }
        break
    }
    
    setErrors(newErrors)
  }

  const handleFieldChange = (field: string, value: string) => {
    // Update the field value
    switch (field) {
      case 'title': setTitle(value); break
      case 'description': setDescription(value); break
      case 'address': setAddress(value); break
      case 'budget': setBudget(value); break
      case 'taskTime': setTaskTime(value); break
    }
    
    // Mark field as touched
    setTouched({ ...touched, [field]: true })
    
    // Validate the field
    validateField(field, value)
  }

  // No selected size needed since we removed task size selection

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Task</Text>
        <NotificationButton size={24} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            {categoriesLoading ? (
              <Text style={styles.loadingText}>Loading categories...</Text>
            ) : (
              <View style={styles.categoriesContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      categoryId === cat.id && styles.categoryButtonActive
                    ]}
                    onPress={() => {
                      setCategoryId(cat.id)
                      setTouched({ ...touched, categoryId: true })
                      validateField('categoryId', cat.id)
                    }}
                  >
                    <Ionicons 
                      name={cat.icon as any} 
                      size={24} 
                      color={categoryId === cat.id ? '#fff' : cat.color} 
                    />
                    <Text style={[
                      styles.categoryButtonText,
                      categoryId === cat.id && styles.categoryButtonTextActive
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Task Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Task Details *</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={[
                  styles.textInput,
                  touched.title && errors.title && styles.inputError
                ]}
                placeholder="What needs to be done?"
                value={title}
                onChangeText={(value) => handleFieldChange('title', value)}
                placeholderTextColor={Colors.text.tertiary}
              />
              {touched.title && errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[
                  styles.textInput, 
                  styles.textArea,
                  touched.description && errors.description && styles.inputError
                ]}
                placeholder="Provide detailed information about the task..."
                value={description}
                onChangeText={(value) => handleFieldChange('description', value)}
                multiline
                numberOfLines={4}
                placeholderTextColor={Colors.text.tertiary}
              />
              {touched.description && errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location - Addis Ababa *</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[
                  styles.textInput,
                  touched.address && errors.address && styles.inputError
                ]}
                placeholder="Street address, building name, etc."
                value={address}
                onChangeText={(value) => handleFieldChange('address', value)}
                placeholderTextColor={Colors.text.tertiary}
              />
              {touched.address && errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subcity *</Text>
              <View style={styles.dropdownContainer}>
                <ScrollView style={styles.dropdown} showsVerticalScrollIndicator={false}>
                  {subcities.map((subcityName) => (
                    <TouchableOpacity
                      key={subcityName}
                      style={[
                        styles.dropdownItem,
                        subcity === subcityName && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setSubcity(subcityName)
                        setTouched({ ...touched, subcity: true })
                        validateField('subcity', subcityName)
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        subcity === subcityName && styles.dropdownItemTextSelected
                      ]}>
                        {subcityName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {subcity && (
                <Text style={styles.selectedText}>Selected: {subcity}</Text>
              )}
              {touched.subcity && errors.subcity && (
                <Text style={styles.errorText}>{errors.subcity}</Text>
              )}
            </View>

            {/* Woreda field removed */}
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget *</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (ETB)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  touched.budget && errors.budget && styles.inputError
                ]}
                placeholder="e.g., 500"
                value={budget}
                onChangeText={(value) => handleFieldChange('budget', value)}
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="numeric"
              />
              {touched.budget && errors.budget && (
                <Text style={styles.errorText}>{errors.budget}</Text>
              )}
            </View>
          </View>

          {/* Schedule - Required */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>When do you need this done? *</Text>
            
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleItem}>
                <Text style={styles.inputLabel}>Date *</Text>
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowCalendar(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                  <Text style={styles.calendarButtonText}>
                    {taskDate ? formatDate(selectedDate) : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.scheduleItem}>
                <Text style={styles.inputLabel}>Time *</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    touched.taskTime && errors.taskTime && styles.inputError
                  ]}
                  placeholder="e.g., 9:00 AM"
                  value={taskTime}
                  onChangeText={(value) => handleFieldChange('taskTime', value)}
                  placeholderTextColor={Colors.text.tertiary}
                />
                {touched.taskTime && errors.taskTime && (
                  <Text style={styles.errorText}>{errors.taskTime}</Text>
                )}
              </View>
              {touched.categoryId && errors.categoryId && (
                <Text style={styles.errorText}>{errors.categoryId}</Text>
              )}
            </View>
          </View>


          {/* Submit Button */}
          <AnimatedButton
            title={loading ? 'Posting Task...' : 'Post Task'}
            onPress={handleSubmit}
            variant="primary"
            size="large"
            icon="checkmark-circle"
            disabled={loading}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
      {showCalendar && (
        <View style={styles.calendarModal}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={() => setShowCalendar(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.calendarScrollView}>
              {Array.from({ length: 30 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() + i)
                const isToday = i === 0
                const isSelected = taskDate === date.toISOString().split('T')[0]
                
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.calendarDateItem,
                      isToday && styles.calendarDateToday,
                      isSelected && styles.calendarDateSelected
                    ]}
                    onPress={() => handleDateSelect(date)}
                  >
                    <Text style={[
                      styles.calendarDateText,
                      isToday && styles.calendarDateTextToday,
                      isSelected && styles.calendarDateTextSelected
                    ]}>
                      {date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    {isToday && (
                      <Text style={styles.calendarTodayLabel}>Today</Text>
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  section: {
    marginVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  textInput: {
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flex1: {
    flex: 1,
  },
  // Task size styles removed - now using simple budget input
  scheduleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  scheduleItem: {
    flex: 1,
  },
  submitButton: {
    marginVertical: Spacing.xl,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    maxHeight: 150,
  },
  dropdown: {
    maxHeight: 150,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  dropdownItemSelected: {
    backgroundColor: '#007AFF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  dropdownItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
  },
  calendarButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  calendarModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  calendarContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    margin: Spacing.lg,
    maxHeight: '80%',
    width: '90%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  calendarCloseButton: {
    padding: Spacing.sm,
  },
  calendarScrollView: {
    maxHeight: 300,
  },
  calendarDateItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarDateToday: {
    backgroundColor: Colors.background.secondary,
  },
  calendarDateSelected: {
    backgroundColor: '#007AFF',
  },
  calendarDateText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  calendarDateTextToday: {
    fontWeight: '600',
  },
  calendarDateTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarTodayLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputError: {
    borderColor: Colors.error[500],
    borderWidth: 2,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error[500],
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
})