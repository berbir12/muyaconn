import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useTaskApplications } from '../../hooks/useTasks'

interface TaskDetail {
  id: string
  customer_id: string
  tasker_id?: string
  title: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  task_date?: string
  task_time?: string
  flexible_date: boolean
  estimated_hours?: number
  budget_min?: number
  budget_max?: number
  final_price?: number
  task_size: 'small' | 'medium' | 'large'
  status: 'posted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  urgency: 'flexible' | 'within_week' | 'urgent'
  special_instructions?: string
  photos?: string[]
  created_at: string
  updated_at: string
  
  // Joined data
  task_categories?: {
    name: string
    slug: string
    icon: string
    color: string
  }
  customer_profile?: {
    full_name: string
    username: string
    avatar_url?: string
    average_rating: number
    total_reviews: number
  }
  tasker_profile?: {
    full_name: string
    username: string
    avatar_url?: string
    average_rating: number
    total_reviews: number
    hourly_rate?: number
  }
}

export default function TaskDetail() {
  const { id } = useLocalSearchParams()
  const { profile } = useAuth()
  const { applications, applyToTask, updateApplicationStatus } = useTaskApplications(id as string)
  
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTask = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_categories (name, slug, icon, color),
          customer_profile:profiles!customer_id (full_name, username, avatar_url, average_rating, total_reviews),
          tasker_profile:profiles!tasker_id (full_name, username, avatar_url, average_rating, total_reviews, hourly_rate)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setTask(data)
    } catch (error: any) {
      console.error('Error fetching task:', error)
      Alert.alert('Error', 'Failed to load task details')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchTask()
    setRefreshing(false)
  }

  useEffect(() => {
    if (id) {
      fetchTask()
    }
  }, [id])

  const handleApplyToTask = () => {
    if (!task) return
    
    Alert.prompt(
      'Apply to Task',
      'Why are you the right person for this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: async (message) => {
            if (message && message.trim()) {
              try {
                await applyToTask(task.id, {
                  message: message.trim(),
                  proposed_price: task.budget_max,
                })
                Alert.alert('Success', 'Your application has been sent!')
                fetchTask() // Refresh task data
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to apply to task')
              }
            }
          }
        },
      ],
      'plain-text',
      '',
      'default'
    )
  }

  const handleAssignTasker = (application: any) => {
    Alert.alert(
      'Assign Tasker',
      `Assign ${application.tasker_profile?.full_name} to this task?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Assign', 
          onPress: async () => {
            try {
              // Update application status to accepted
              await updateApplicationStatus(application.id, 'accepted')
              
              // Update task with assigned tasker
              const { error } = await supabase
                .from('tasks')
                .update({ 
                  tasker_id: application.tasker_id,
                  status: 'assigned',
                  updated_at: new Date().toISOString()
                })
                .eq('id', task?.id)

              if (error) throw error

              Alert.alert('Success', 'Tasker has been assigned to your task!')
              fetchTask() // Refresh task data
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to assign tasker')
            }
          }
        },
      ]
    )
  }

  const handleUpdateStatus = () => {
    if (!task) return
    
    const isCustomer = profile?.role === 'customer' && task.customer_id === profile?.id
    const isTasker = profile?.role === 'tasker' && task.tasker_id === profile?.id
    
    let options: any[] = []
    
    if (isCustomer) {
      if (task.status === 'posted') {
        options = [
          { text: 'Cancel Task', style: 'destructive', action: 'cancelled' },
        ]
      } else if (task.status === 'assigned') {
        options = [
          { text: 'Mark Complete', action: 'completed' },
        ]
      }
    } else if (isTasker) {
      if (task.status === 'assigned') {
        options = [
          { text: 'Start Task', action: 'in_progress' },
        ]
      } else if (task.status === 'in_progress') {
        options = [
          { text: 'Mark Complete', action: 'completed' },
        ]
      }
    }

    if (options.length === 0) return

    Alert.alert(
      'Update Task Status',
      `Current status: ${task.status}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...options.map(option => ({
          text: option.text,
          style: option.style,
          onPress: () => updateTaskStatus(option.action)
        }))
      ]
    )
  }

  const updateTaskStatus = async (status: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', task?.id)

      if (error) throw error

      Alert.alert('Success', 'Task status updated!')
      fetchTask() // Refresh task data
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update task status')
    }
  }

  const handleStartChat = () => {
    if (!task) return
    
    const chatPartnerId = profile?.role === 'customer' ? task.tasker_id : task.customer_id
    if (chatPartnerId) {
      router.push(`/chat/${task.id}?partnerId=${chatPartnerId}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return '#007AFF'
      case 'assigned': return '#ffc107'
      case 'in_progress': return '#17a2b8'
      case 'completed': return '#28a745'
      case 'cancelled': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return '#dc3545'
      case 'within_week': return '#ffc107'
      case 'flexible': return '#28a745'
      default: return '#6c757d'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading task details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Task not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const isMyTask = (profile?.role === 'customer' && task.customer_id === profile?.id) ||
                   (profile?.role === 'tasker' && task.tasker_id === profile?.id)
  const canApply = profile?.role === 'tasker' && !task.tasker_id && task.status === 'posted'
  const canAssign = profile?.role === 'customer' && task.customer_id === profile?.id && task.status === 'posted'

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        {isMyTask && (
          <TouchableOpacity onPress={() => router.push(`/edit-task/${task.id}`)}>
            <Ionicons name="create" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Task Header */}
        <View style={styles.taskHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <View style={styles.badgesContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                <Text style={styles.badgeText}>{task.status.replace('_', ' ')}</Text>
              </View>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(task.urgency) }]}>
                <Text style={styles.badgeText}>{task.urgency.replace('_', ' ')}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.budget}>
            ${task.budget_min}-${task.budget_max}
          </Text>
        </View>

        {/* Category */}
        <View style={styles.categoryContainer}>
          <View style={[styles.categoryIcon, { backgroundColor: task.task_categories?.color }]}>
            <Ionicons name={task.task_categories?.icon as any} size={20} color="#fff" />
          </View>
          <Text style={styles.categoryName}>{task.task_categories?.name}</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        {/* Task Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="resize" size={20} color="#666" />
              <Text style={styles.detailLabel}>Size:</Text>
              <Text style={styles.detailValue}>{task.task_size}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{task.city}, {task.state}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>
                {task.task_date ? formatDate(task.task_date) : 'Flexible'}
              </Text>
            </View>
            {task.task_time && (
              <View style={styles.detailItem}>
                <Ionicons name="time" size={20} color="#666" />
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>{task.task_time}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Special Instructions */}
        {task.special_instructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <Text style={styles.instructions}>{task.special_instructions}</Text>
          </View>
        )}

        {/* Customer/Tasker Info */}
        {task.customer_profile && profile?.role === 'tasker' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{task.customer_profile.full_name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.rating}>
                    {task.customer_profile.average_rating?.toFixed(1) || '0.0'}
                  </Text>
                  <Text style={styles.reviews}>
                    ({task.customer_profile.total_reviews || 0} reviews)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {task.tasker_profile && profile?.role === 'customer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Tasker</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{task.tasker_profile.full_name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.rating}>
                    {task.tasker_profile.average_rating?.toFixed(1) || '0.0'}
                  </Text>
                  <Text style={styles.reviews}>
                    ({task.tasker_profile.total_reviews || 0} reviews)
                  </Text>
                </View>
                {task.tasker_profile.hourly_rate && (
                  <Text style={styles.hourlyRate}>
                    ${task.tasker_profile.hourly_rate}/hr
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Applications (for customers) */}
        {canAssign && applications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Applications ({applications.length})</Text>
            {applications.map((application) => (
              <View key={application.id} style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <Text style={styles.applicantName}>
                    {application.tasker_profile?.full_name || 'Tasker'}
                  </Text>
                  <Text style={styles.applicationPrice}>
                    ${application.proposed_price || task.budget_max}
                  </Text>
                </View>
                
                {application.tasker_profile && (
                  <View style={styles.applicantInfo}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.rating}>
                        {application.tasker_profile.average_rating?.toFixed(1) || '0.0'}
                      </Text>
                      <Text style={styles.reviews}>
                        ({application.tasker_profile.total_reviews || 0})
                      </Text>
                    </View>
                    {application.tasker_profile.hourly_rate && (
                      <Text style={styles.hourlyRate}>
                        ${application.tasker_profile.hourly_rate}/hr
                      </Text>
                    )}
                  </View>
                )}

                {application.message && (
                  <Text style={styles.applicationMessage}>{application.message}</Text>
                )}

                <TouchableOpacity 
                  style={styles.assignButton}
                  onPress={() => handleAssignTasker(application)}
                >
                  <Text style={styles.assignButtonText}>Assign This Tasker</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {canApply && (
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleApplyToTask}
          >
            <Text style={styles.primaryButtonText}>Apply for Task</Text>
          </TouchableOpacity>
        )}

        {isMyTask && ['assigned', 'in_progress'].includes(task.status) && (
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={handleStartChat}
          >
            <Ionicons name="chatbubble" size={20} color="#007AFF" />
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>
        )}

        {isMyTask && ['posted', 'assigned', 'in_progress'].includes(task.status) && (
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleUpdateStatus}
          >
            <Text style={styles.secondaryButtonText}>Update Status</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#007AFF',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  taskHeader: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  budget: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  reviews: {
    fontSize: 14,
    color: '#999',
  },
  hourlyRate: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
  applicationCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  applicationPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  applicationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  assignButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  chatButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
})