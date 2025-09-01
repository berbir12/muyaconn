import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { useCategories } from '../hooks/useCategories'
import { supabase } from '../lib/supabase'
import NotificationButton from '../components/NotificationButton'
import Colors from '../constants/Colors'

const TASK_SIZES = [
  { 
    id: 'small', 
    label: 'Small', 
    description: '1 hour or less', 
    budget: 50,
    example: 'Quick fix, simple assembly'
  },
  { 
    id: 'medium', 
    label: 'Medium', 
    description: '2-4 hours', 
    budget: 125,
    example: 'TV mounting, furniture assembly'
  },
  { 
    id: 'large', 
    label: 'Large', 
    description: '4+ hours or multi-day', 
    budget: 325,
    example: 'Moving help, deep cleaning'
  },
]

export default function PostTask() {
  const { category } = useLocalSearchParams()
  const { profile } = useAuth()
  const { createTask } = useTasks()
  const { categories, loading: categoriesLoading } = useCategories()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [taskSize, setTaskSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [budget, setBudget] = useState<number>(125)
  const [taskDate, setTaskDate] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [specificLocation, setSpecificLocation] = useState('')
  const [district, setDistrict] = useState('')
  const [urgency, setUrgency] = useState<'flexible' | 'within_week' | 'urgent'>('flexible')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(false)

  // Set initial category if provided
  useEffect(() => {
    if (category && categories.length > 0) {
      const foundCategory = categories.find(cat => cat.id === category)
      if (foundCategory) {
        setSelectedCategoryId(foundCategory.id)
      }
    }
  }, [category, categories])

  // Update budget when task size changes
  useEffect(() => {
    const size = TASK_SIZES.find(s => s.id === taskSize)
    if (size) {
      setBudget(size.budget)
    }
  }, [taskSize])

  const handlePostTask = async () => {
    console.log('=== handlePostTask called ===')
    console.log('User profile:', profile)
    console.log('Form data:', {
      title,
      description,
      selectedCategoryId,
      specificLocation,
      district,
      taskSize,
      budget,
      taskDate,
      taskTime,
      urgency,
      specialInstructions
    })

    if (!profile) {
      Alert.alert('Authentication Error', 'Please log in to post a task')
      return
    }

          if (!title || !description || !selectedCategoryId || !specificLocation || !district || !taskDate || !taskTime) {
      Alert.alert('Missing Information', 'Please fill in all required fields including date and time')
      return
    }

    if (budget < 0) { // Assuming budget cannot be negative
      Alert.alert('Invalid Budget', 'Budget cannot be negative')
      return
    }

    // Validate date format (required)
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(taskDate)) {
      Alert.alert('Invalid Date Format', 'Please use DD/MM/YYYY format (e.g., 29/08/2025)')
      return
    }

    // Validate time format (required)
    if (!/^\d{2}:\d{2}$/.test(taskTime)) {
      Alert.alert('Invalid Time Format', 'Please use HH:MM format (e.g., 14:30)')
      return
    }

    setLoading(true)
    try {
      console.log('=== About to call createTask ===')
      const taskData = {
        title,
        description,
        category_id: selectedCategoryId,
        address: specificLocation,
        city: district,
        state: 'Addis Ababa',
        zip_code: 'N/A',
        task_size: taskSize,
        budget: budget,
        task_date: taskDate,
        task_time: taskTime,
        urgency,
        special_instructions: specialInstructions || undefined,
      }
      
      console.log('Task data being sent:', taskData)
      
      const result = await createTask(taskData)
      
      console.log('=== createTask completed successfully ===')
      console.log('createTask result:', result)
      
      Alert.alert(
        'Task Posted Successfully!',
        'Taskers in your area will be notified and can apply to help you.',
        [
          {
            text: 'View My Tasks',
            onPress: () => router.push('/jobs')
          },
          {
            text: 'Post Another',
            onPress: () => {
              // Reset form
              setTitle('')
              setDescription('')
              setSelectedCategoryId('')
              setTaskSize('medium')
              setBudget(125)
              setSpecificLocation('')
              setDistrict('')
              setTaskDate('')
              setTaskTime('')
              setUrgency('flexible')
              setSpecialInstructions('')
            }
          }
        ]
      )
    } catch (error: any) {
      console.error('=== Error in handlePostTask ===')
      console.error('Error details:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      Alert.alert('Error', `Failed to post task: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Task</Text>
                <NotificationButton size={24} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    selectedCategoryId === cat.id && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={24} 
                    color={selectedCategoryId === cat.id ? '#fff' : cat.color} 
                  />
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategoryId === cat.id && styles.categoryButtonTextActive
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Task Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Task Details</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Task title"
              placeholderTextColor={Colors.text.tertiary}
              value={title}
              onChangeText={setTitle}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor={Colors.text.tertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Task Size */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Task Size</Text>
            <View style={styles.sizeContainer}>
              {TASK_SIZES.map((size) => (
                <TouchableOpacity
                  key={size.id}
                  style={[
                    styles.sizeButton,
                    taskSize === size.id && styles.sizeButtonActive
                  ]}
                  onPress={() => setTaskSize(size.id as 'small' | 'medium' | 'large')}
                >
                  <Text style={[
                    styles.sizeButtonText,
                    taskSize === size.id && styles.sizeButtonTextActive
                  ]}>
                    {size.label}
                  </Text>
                  <Text style={styles.sizeDescription}>{size.description}</Text>
                  <Text style={styles.sizeExample}>{size.example}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget</Text>
            <View style={styles.budgetContainer}>
              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>Budget</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.text.tertiary}
                  value={budget.toString()}
                  onChangeText={(text) => setBudget(parseInt(text) || 0)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date & Time *</Text>
            <View style={styles.dateTimeContainer}>
              <TextInput
                style={styles.input}
                placeholder="Date (DD/MM/YYYY) *"
                placeholderTextColor={Colors.text.tertiary}
                value={taskDate}
                onChangeText={setTaskDate}
              />
              <TextInput
                style={styles.input}
                placeholder="Time (HH:MM) *"
                placeholderTextColor={Colors.text.tertiary}
                value={taskTime}
                onChangeText={setTaskTime}
              />
            </View>
            <Text style={styles.helperText}>
              Date format: DD/MM/YYYY (e.g., 29/08/2025) | Time format: HH:MM (e.g., 14:30)
            </Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Specific location (e.g., street, landmark, building)"
              placeholderTextColor={Colors.text.tertiary}
              value={specificLocation}
              onChangeText={setSpecificLocation}
            />
            <View style={styles.locationContainer}>
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>District *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    // Show district picker
                    const districts = [
                      'Addis Ketema',
                      'Akaki Kality',
                      'Arada',
                      'Bole',
                      'Gullele',
                      'Kolfe Keranio',
                      'Lideta',
                      'Nifas Silk-Lafto',
                      'Yeka',
                      'Kirkos',
                      'Kolfe Keranio',
                      'Lemi Kura',
                      'Sululta',
                      'Burayu',
                      'Sebeta',
                      'Dukem',
                      'Gelan',
                      'Holeta',
                      'Mendi',
                      'Mogadishu',
                      'Sendafa',
                      'Sululta',
                      'Tulu Dimtu',
                      'Waliso'
                    ]
                    Alert.alert(
                      'Select District',
                      'Choose a district in Addis Ababa',
                      districts.map(districtName => ({
                        text: districtName,
                        onPress: () => setDistrict(districtName)
                      }))
                    )
                  }}
                >
                  <Text style={district ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
                    {district || 'Select district'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Urgency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Urgency</Text>
            <View style={styles.urgencyContainer}>
              {[
                { id: 'flexible', label: 'Flexible', icon: 'calendar-outline' },
                { id: 'within_week', label: 'Within Week', icon: 'time' },
                { id: 'urgent', label: 'Urgent', icon: 'flash' }
              ].map((urgencyOption) => (
                <TouchableOpacity
                  key={urgencyOption.id}
                  style={[
                    styles.urgencyButton,
                    urgency === urgencyOption.id && styles.urgencyButtonActive
                  ]}
                  onPress={() => setUrgency(urgencyOption.id as any)}
                >
                  <Ionicons 
                    name={urgencyOption.icon as any} 
                    size={20} 
                    color={urgency === urgencyOption.id ? '#fff' : '#666'} 
                  />
                  <Text style={[
                    styles.urgencyButtonText,
                    urgency === urgencyOption.id && styles.urgencyButtonTextActive
                  ]}>
                    {urgencyOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Special Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Any special requirements or notes"
              placeholderTextColor={Colors.text.tertiary}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handlePostTask}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Posting...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Post Task</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  sizeContainer: {
    gap: 12,
  },
  sizeButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
  },
  sizeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  sizeButtonTextActive: {
    color: '#fff',
  },
  sizeDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  sizeExample: {
    fontSize: 12,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  budgetContainer: {
    // Single budget input, no need for row layout
  },
  budgetInput: {
    // Single budget input, no need for flex
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  locationInput: {
    flex: 1,
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
    gap: 8,
  },
  urgencyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  urgencyButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: -8,
    marginBottom: 16,
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#212529',
  },
  dropdownButtonPlaceholder: {
    fontSize: 16,
    color: '#6c757d',
  },
})
