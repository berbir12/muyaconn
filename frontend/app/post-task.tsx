import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { TaskService } from '../services/TaskService'
import { supabase } from '../lib/supabase'
import Colors from '../constants/Colors'

const categories = [
  'Cleaning',
  'Handyman',
  'Delivery',
  'Photography',
  'Technology',
  'Gardening',
  'Pet Care',
  'Moving',
  'Tutoring',
  'Cooking',
  'Painting',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Landscaping',
  'Event Planning',
  'Other'
]

export default function PostTask() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { category } = useLocalSearchParams()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth')
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  useEffect(() => {
    if (category && typeof category === 'string') {
      setSelectedCategory(category)
    }
  }, [category])

  const getOrCreateCategory = async (categoryName: string): Promise<string> => {
    try {
      // First try to find existing category
      const { data: existingCategory } = await supabase
        .from('task_categories')
        .select('id')
        .eq('name', categoryName)
        .single()

      if (existingCategory) {
        return existingCategory.id
      }

      // Create new category if it doesn't exist
      const { data: newCategory, error } = await supabase
        .from('task_categories')
        .insert([{
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
          description: `${categoryName} services`,
          icon: 'briefcase',
          color: '#8B5CF6',
          is_active: true,
          sort_order: 0
        }])
        .select('id')
        .single()

      if (error) throw error
      return newCategory.id
    } catch (error) {
      console.error('Error getting/creating category:', error)
      // Return a default category ID or create a fallback
      return 'default-category-id'
    }
  }

  const handlePostTask = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to post a task')
      return
    }

    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title')
      return
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a task description')
      return
    }
    if (!price.trim()) {
      Alert.alert('Error', 'Please enter a price range')
      return
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location')
      return
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category')
      return
    }

    setLoading(true)
    try {
      // First, get or create category
      const categoryId = await getOrCreateCategory(selectedCategory)
      
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        budget: parseFloat(price) || 0,
        address: location.trim(),
        city: 'Addis Ababa', // Default city
        state: 'Addis Ababa',
        zip_code: '1000',
        flexible_date: true,
        estimated_hours: 2, // Default estimate
        task_size: 'medium' as const,
        urgency: urgent ? 'urgent' as const : 'flexible' as const,
        status: 'open' as const,
        customer_id: user.id,
        category_id: categoryId,
        requirements: [],
        attachments: [],
        tags: [selectedCategory.toLowerCase()],
        is_featured: false,
        is_urgent: urgent,
        payment_status: 'pending' as const,
        special_instructions: '',
        photos: [],
        estimated_duration_hours: 2
      }

      const createdTask = await TaskService.createTask(taskData)
      
      if (!createdTask) {
        throw new Error('Failed to create task')
      }
      
      Alert.alert('Success', 'Task posted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setTitle('')
            setDescription('')
            setPrice('')
            setLocation('')
            setSelectedCategory('')
            setUrgent(false)
          }
        }
      ])
    } catch (error) {
      console.error('Error posting task:', error)
      Alert.alert('Error', 'Failed to post task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.neutral[900]} />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Post a Task</Text>
                <Text style={styles.headerSubtitle}>Tell us what you need done</Text>
              </View>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Task Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Task Title *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="create-outline" size={20} color={Colors.neutral[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., House Cleaning, Furniture Assembly"
                    placeholderTextColor={Colors.neutral[400]}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                  />
                </View>
                <Text style={styles.characterCount}>{title.length}/100</Text>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.neutral[400]} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe what needs to be done in detail..."
                    placeholderTextColor={Colors.neutral[400]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                  />
                </View>
                <Text style={styles.characterCount}>{description.length}/500</Text>
              </View>

              {/* Price and Location Row */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Price Range *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="cash-outline" size={20} color={Colors.neutral[400]} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., $50 - $100"
                      placeholderTextColor={Colors.neutral[400]}
                      value={price}
                      onChangeText={setPrice}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Location *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color={Colors.neutral[400]} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Addis Ababa, Bole"
                      placeholderTextColor={Colors.neutral[400]}
                      value={location}
                      onChangeText={setLocation}
                    />
                  </View>
                </View>
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <View style={styles.categoriesGrid}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        selectedCategory === category && styles.categoryChipActive,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategory === category && styles.categoryChipTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Urgent Toggle */}
              <View style={styles.inputGroup}>
                <TouchableOpacity
                  style={styles.urgentToggle}
                  onPress={() => setUrgent(!urgent)}
                >
                  <View style={[styles.toggle, urgent && styles.toggleActive]}>
                    {urgent && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <View style={styles.toggleContent}>
                    <View style={styles.toggleHeader}>
                      <Ionicons name="flash" size={20} color={urgent ? Colors.warning[500] : Colors.neutral[400]} />
                      <Text style={styles.toggleTitle}>Mark as Urgent</Text>
                    </View>
                    <Text style={styles.toggleSubtitle}>This task needs immediate attention</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Post Button */}
              <TouchableOpacity
                style={[styles.postButton, loading && styles.postButtonDisabled]}
                onPress={handlePostTask}
                disabled={loading}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.postButtonText}>
                  {loading ? 'Posting Task...' : 'Post Task'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral[900],
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.neutral[600],
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral[900],
    marginLeft: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.neutral[500],
    textAlign: 'right',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.neutral[600],
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toggleActive: {
    backgroundColor: Colors.warning[500],
    borderColor: Colors.warning[500],
  },
  toggleContent: {
    flex: 1,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginLeft: 8,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: Colors.neutral[600],
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 32,
    marginBottom: 40,
    gap: 8,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  postButtonDisabled: {
    backgroundColor: Colors.neutral[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})