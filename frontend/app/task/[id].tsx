import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useTasks } from '../../hooks/useTasks'
import { useNotifications } from '../../hooks/useNotifications'
import { supabase } from '../../lib/supabase'
import Colors from '../../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../../constants/Design'
import TaskApplicationCard from '../../components/TaskApplicationCard'
import TaskerProfileModal from '../../components/TaskerProfileModal'
import NotificationButton from '../../components/NotificationButton'

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { profile } = useAuth()
  const { tasks, loading, error, refetch } = useTasks()
  const { notifyApplicationAccepted, notifyApplicationDeclined } = useNotifications()
  
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showTaskerProfile, setShowTaskerProfile] = useState(false)
  const [selectedTaskerProfile, setSelectedTaskerProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loadingApplications, setLoadingApplications] = useState(false)

  useEffect(() => {

    if (id && tasks.length > 0) {
      const task = tasks.find(t => t.id === id)

      if (task) {
        setSelectedTask(task)
        // Only fetch applications if we have a profile and the task is owned by the current user
        if (profile && task.customer_id === profile.id) {
          fetchApplications(task.id)
        }
      }
    }
  }, [id, tasks, profile])

  const fetchApplications = async (taskId: string) => {
    if (!profile) {
      return
    }
    
    // Only fetch applications if the current user is the task owner
    if (selectedTask && selectedTask.customer_id !== profile.id) {
      return
    }
    
    try {
      setLoadingApplications(true)
      
      // Fetch real applications from Supabase

      const { data: applicationsData, error } = await supabase
        .from('task_applications')
        .select(`
          *,
          tasker_profile:profiles!task_applications_tasker_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            rating_average,
            rating_count,
            hourly_rate,
            bio,
            skills
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
      


      if (error) {
        console.error('Error fetching applications:', error)
        return
      }

      if (applicationsData) {

        setApplications(applicationsData)
      } else {

        setApplications([])
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoadingApplications(false)
    }
  }

  const handleAcceptApplication = async (application: any) => {
    try {
      // Update application status in Supabase
      const { error: updateError } = await supabase
        .from('task_applications')
        .update({ status: 'accepted' })
        .eq('id', application.id)

      if (updateError) {
        throw updateError
      }

      // Update task status to 'in_progress' to move it to bookings and prevent new applications
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'in_progress',
          tasker_id: application.tasker_id
        })
        .eq('id', selectedTask.id)

      if (taskError) {
        throw taskError
      }

      // Create chat for the accepted task
      try {
        // Check if chat already exists first
        const { data: existingChat, error: checkError } = await supabase
          .from('chats')
          .select('*')
          .eq('task_id', selectedTask.id)
          .eq('customer_id', selectedTask.customer_id)
          .eq('tasker_id', application.tasker_id)
          .limit(1)

        if (checkError) {
          console.warn('Error checking for existing chat:', checkError)
        } else if (existingChat && existingChat.length > 0) {
          // Chat already exists, no need to create
        } else {
          // Create new chat
          const { error: chatError } = await supabase
            .from('chats')
            .insert({
              task_id: selectedTask.id,
              customer_id: selectedTask.customer_id,
              tasker_id: application.tasker_id
            })

          if (chatError) {
            if (chatError.code === '23505') {

            } else {
              console.warn('Failed to create chat:', chatError)
            }
          } else {

          }
        }
      } catch (chatErr) {
        console.warn('Error creating chat:', chatErr)
        // Don't fail the whole operation if chat creation fails
      }
      
      // Send notification
      await notifyApplicationAccepted(
        application.tasker_id,
        selectedTask.id,
        selectedTask.title
      )
      
      Alert.alert(
        '🎉 Application Accepted!',
        `Great! The tasker will now work on your task. Here's what happens next:\n\n• The tasker will contact you to discuss details\n• You can chat with them using the chat button\n• Track progress in your "My Tasks" tab\n• Mark as complete when work is done`,
        [
          {
            text: 'View My Tasks',
            onPress: () => router.push('/jobs')
          },
          {
            text: 'Continue',
            style: 'default'
          }
        ]
      )
      
      // Refresh applications and refetch task data
      fetchApplications(selectedTask.id)
      refetch()
    } catch (error) {
      console.error('Error accepting application:', error)
      Alert.alert('Error', 'Failed to accept application. Please try again.')
    }
  }

  const handleDeclineApplication = async (application: any) => {
    try {
      // Update application status in Supabase
      const { error: updateError } = await supabase
        .from('task_applications')
        .update({ status: 'rejected' })
        .eq('id', application.id)

      if (updateError) {
        throw updateError
      }
      
      // Send notification
      await notifyApplicationDeclined(
        application.tasker_id,
        selectedTask.id,
        selectedTask.title
      )
      
      Alert.alert('Application Declined', 'The tasker has been notified that their application was declined.')
      
      // Refresh applications
      fetchApplications(selectedTask.id)
    } catch (error) {
      console.error('Error declining application:', error)
      Alert.alert('Error', 'Failed to decline application. Please try again.')
    }
  }

  const handleViewProfile = (taskerProfile: any) => {
    setSelectedTaskerProfile(taskerProfile)
    setShowTaskerProfile(true)
  }



  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading task details...</Text>
        </View>
      </View>
    )
  }

  if (error || !selectedTask) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error[500]} />
          <Text style={styles.errorText}>
            {error || 'Task not found'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container} key={`task-detail-${id}`}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <NotificationButton />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Information */}
        <View style={styles.taskSection}>
          <Text style={styles.sectionTitle}>Task Information</Text>
          <View style={styles.taskCard}>
            <Text style={styles.taskTitle}>{selectedTask.title}</Text>
            <Text style={styles.taskDescription}>{selectedTask.description}</Text>
            
            <View style={styles.taskDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={16} color={Colors.text.secondary} />
                <Text style={styles.detailText}>
                  {selectedTask.address}, {selectedTask.city}, {selectedTask.state}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="cash" size={16} color={Colors.text.secondary} />
                <Text style={styles.detailText}>
                  Budget: ${selectedTask.budget}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color={Colors.text.secondary} />
                <Text style={styles.detailText}>
                  Posted {new Date(selectedTask.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Applications Section - Only show for task owners */}
        {(profile?.role === 'customer' || profile?.role === 'both') && selectedTask.customer_id === profile.id && (
          <View style={styles.applicationsSection}>
            <Text style={styles.sectionTitle}>
              Applications ({applications.length})
            </Text>
            
            {loadingApplications ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary[500]} />
                <Text style={styles.loadingText}>Loading applications...</Text>
              </View>
            ) : applications.length > 0 ? (
              applications.map((application) => (
                <TaskApplicationCard
                  key={application.id}
                  application={application}
                  onAccept={() => handleAcceptApplication(application)}
                  onDecline={() => handleDeclineApplication(application)}
                  onViewProfile={() => handleViewProfile(application.tasker_profile)}
                  isOwner={true}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people" size={48} color={Colors.text.tertiary} />
                <Text style={styles.emptyStateText}>No applications yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Taskers will be able to apply to your task once it's posted
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Tasker Profile Modal */}
      <TaskerProfileModal
        visible={showTaskerProfile}
        taskerProfile={selectedTaskerProfile}
        onClose={() => setShowTaskerProfile(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.secondary,
    zIndex: 1000,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  taskSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  taskCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  taskTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  taskDescription: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  taskDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
  },
  applicationsSection: {
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
  },
})
