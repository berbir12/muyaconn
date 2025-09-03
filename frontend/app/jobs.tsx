import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { useCategories } from '../hooks/useCategories'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import TaskCard from '../components/TaskCard'
import TaskApplicationModal from '../components/TaskApplicationModal'
import TaskApplicationCard from '../components/TaskApplicationCard'
import TaskerProfileModal from '../components/TaskerProfileModal'
import NotificationButton from '../components/NotificationButton'
import SimpleChatModal from '../components/SimpleChatModal'
import SearchFilter, { SearchFilters } from '../components/SearchFilter'

export default function Jobs() {
  const { profile } = useAuth()
  const { tasks, loading, error, refetch } = useTasks()
  const { categories } = useCategories()
  
  const [viewMode, setViewMode] = useState<'available' | 'my-tasks'>('available')
  
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [selectedTaskForApplications, setSelectedTaskForApplications] = useState<any>(null)
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [showTaskerProfileModal, setShowTaskerProfileModal] = useState(false)
  const [userApplications, setUserApplications] = useState<Set<string>>(new Set())
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string>('')
  const [currentTaskId, setCurrentTaskId] = useState<string>('')
  const [currentCustomerId, setCurrentCustomerId] = useState<string>('')
  const [currentTaskerId, setCurrentTaskerId] = useState<string>('')
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null)

  // Simple notification function that works with current setup
  const createSimpleNotification = async (userId: string, title: string, message: string, type: string) => {
    try {
      // Ensure the type is one of the allowed values based on current schema
      const allowedTypes = ['task', 'application', 'message', 'review', 'system', 'application_accepted', 'application_declined', 'direct_booking']
      const safeType = allowedTypes.includes(type) ? type : 'system'
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type: safeType,
          read: false,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Notification creation error:', error)
        // Don't throw error - notifications are not critical for core functionality
      }
    } catch (error) {
      console.error('Notification creation failed:', error)
    }
  }

  const fetchUserApplications = async () => {
    if (!profile) {

      setUserApplications(new Set())
      return
    }
    
    // Only fetch applications for taskers or users with both roles
    if (profile.role !== 'tasker' && profile.role !== 'both') {

      setUserApplications(new Set()) // Clear applications if user is not a tasker
      return
    }
    
    try {

      const { data: applications, error } = await supabase
        .from('task_applications')
        .select('task_id, status, created_at')
        .eq('tasker_id', profile.id)
      
      if (error) {
        console.error('Error fetching user applications:', error)
        setUserApplications(new Set()) // Clear on error
        return
      }
      
      if (applications && applications.length > 0) {
        // Include ALL applications to prevent re-application to any task the user has already applied to
        // This includes pending, accepted, and rejected applications
        const taskIds = new Set(applications.map(app => app.task_id))
        setUserApplications(taskIds)
      } else {

        setUserApplications(new Set())
      }
    } catch (error) {
      console.error('Error fetching user applications:', error)
      setUserApplications(new Set()) // Clear on error
    }
  }

  useEffect(() => {
    if (profile) {
      fetchUserApplications()
    } else {
      // Clear applications when user logs out
      setUserApplications(new Set())
    }
  }, [profile])

  const handleApplyToTask = (task: any) => {

    
    if (userApplications.has(task.id)) {
      // Double-check with database to get the specific status
      const checkApplicationStatus = async () => {
        try {
          const { data: dbApplications, error } = await supabase
            .from('task_applications')
            .select('status')
            .eq('task_id', task.id)
            .eq('tasker_id', profile?.id)
            .single()

          if (error) {
            console.error('Database check error:', error)
            return 'unknown'
          }
          return dbApplications?.status || 'unknown'
        } catch (error) {
          console.error('Error checking application status:', error)
          return 'unknown'
        }
      }

      // Get the specific status and show appropriate message
      checkApplicationStatus().then(status => {
        let title = 'Cannot Apply'
        let message = 'You cannot apply to this task.'
        
        switch (status) {
          case 'pending':
            title = 'Already Applied'
            message = 'You have already applied to this task and it is pending review.'
            break
          case 'accepted':
            title = 'Application Accepted'
            message = 'Your application has already been accepted for this task.'
            break
          case 'rejected':
            title = 'Application Declined'
            message = 'Your application for this task was declined. You cannot apply again.'
            break
          default:
            title = 'Already Applied'
            message = 'You have already applied to this task. You cannot apply multiple times.'
        }

        Alert.alert(
          title,
          message,
          [
            { text: 'OK' },
            { 
              text: 'Refresh Status', 
              onPress: () => {

                fetchUserApplications()
              }
            }
          ]
        )
      })
      return
    }
    setSelectedTask(task)
    setShowApplicationModal(true)
    fetchUserApplications() // Refresh on modal open
  }

  const handleApplicationSubmitted = () => {
    fetchUserApplications() // Refresh on successful submission
  }

  // Debug function to check application status
  const debugApplicationStatus = async (taskId: string) => {
    try {

      
      // Check database directly
      const { data: dbApplications, error } = await supabase
        .from('task_applications')
        .select('*')
        .eq('task_id', taskId)
        .eq('tasker_id', profile?.id)
      
      if (error) {
        console.error('Database check error:', error)
      } else {

      }
    } catch (error) {
      console.error('Debug function error:', error)
    }
  }

  // Function to manually refresh application status
  const refreshApplicationStatus = async () => {

    await fetchUserApplications()
  }

  // Function to clear any problematic applications (for testing)
  const clearTestApplications = async () => {
    if (!profile) return
    
    try {

      
      // Delete any applications by this user
      const { error } = await supabase
        .from('task_applications')
        .delete()
        .eq('tasker_id', profile.id)
      
      if (error) {
        console.error('Error clearing applications:', error)
        Alert.alert('Error', 'Failed to clear applications')
      } else {

        setUserApplications(new Set())
        Alert.alert('Success', 'Test applications cleared')
      }
    } catch (error) {
      console.error('Error in clearTestApplications:', error)
      Alert.alert('Error', 'Failed to clear applications')
    }
  }

  const handleViewApplications = async (task: any) => {
    setSelectedTaskForApplications(task)
    setShowApplicationsModal(true)
    setLoadingApplications(true)
    
    // Fetch applications for this specific task
    try {
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
        .eq('task_id', task.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching applications:', error)
        return
      }

      // Update the task with its applications
      setSelectedTaskForApplications({
        ...task,
        applications: applicationsData || []
      })
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoadingApplications(false)
    }
  }

  const handleViewTaskerProfile = (application: any) => {
    setSelectedApplication(application)
    setShowTaskerProfileModal(true)
  }

  const handleAcceptApplication = async (application: any) => {
    try {

      
      // Update application status
      const { error: updateError } = await supabase
        .from('task_applications')
        .update({ status: 'accepted' })
        .eq('id', application.id)

      if (updateError) throw updateError


      // Update task status to 'in_progress' and assign tasker
      const { data: updateData, error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'in_progress',
          tasker_id: application.tasker_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.task_id)
        .select()

      if (taskError) throw taskError
      
      if (updateData && updateData.length > 0) {

      } else {
        console.warn('Task update returned no data')
      }

      // Note: No need to create a separate booking record since we're working with tasks table directly
      // The task status update above handles the booking functionality

      // Create chat for the accepted task
      try {
        // Check if chat already exists first
        const { data: existingChat, error: checkError } = await supabase
          .from('chats')
          .select('*')
          .eq('task_id', application.task_id)
          .eq('customer_id', profile?.id)
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
              task_id: application.task_id,
              customer_id: profile?.id,
              tasker_id: application.tasker_id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
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

      // Send notification to tasker
      await createSimpleNotification(
        application.tasker_id,
        'Application Accepted! 🎉',
        `Your application for "${selectedTaskForApplications?.title || 'Task'}" has been accepted. Check your bookings to start working!`,
        'application_accepted'
      )

      // Enhanced success feedback with next steps
      Alert.alert(
        '🎉 Application Accepted!',
        `Great! ${application.tasker_profile?.full_name || 'The tasker'} will now work on your task. Here's what happens next:\n\n• The tasker will contact you to discuss details\n• You can chat with them using the chat button\n• Track progress in your "My Tasks" tab\n• Mark as complete when work is done`,
        [
          {
            text: 'View My Tasks',
            onPress: () => setViewMode('my-tasks')
          },
          {
            text: 'Continue',
            style: 'default'
          }
        ]
      )
      
      setShowApplicationsModal(false)
      

      
      // Refresh applications for the current task
      if (selectedTaskForApplications) {
        handleViewApplications(selectedTaskForApplications)
      }
      
      // Force a complete refresh of tasks data

      await refetch()
      
      // Also manually update the local tasks state to ensure immediate UI update
      if (tasks) {
        const updatedTasks = tasks.map(task => 
          task.id === application.task_id 
            ? { ...task, status: 'in_progress', tasker_id: application.tasker_id }
            : task
        )
        // Note: We can't directly set tasks here since it's from a hook
        // The refetch should handle this, but we'll log for debugging

      }
      

      
      // Verify the task was actually updated in the database
      const { data: verifyData, error: verifyError } = await supabase
        .from('tasks')
        .select('id, status, tasker_id')
        .eq('id', application.task_id)
        .single()
      
      if (verifyError) {
        console.error('Failed to verify task update:', verifyError)
      } else {

        if (verifyData.status !== 'in_progress') {
          console.error('Task status was not properly updated! Expected: in_progress, Got:', verifyData.status)
        }
      }
      
    } catch (error: any) {
      console.error('Error accepting application:', error)
      Alert.alert('Error', 'Failed to accept application. Please try again.')
    }
  }

  const handleDeclineApplication = async (application: any) => {
    try {
      const { error } = await supabase
        .from('task_applications')
        .update({ status: 'rejected' })
        .eq('id', application.id)

      if (error) throw error

      // Send notification to tasker
      if (application) {
        await createSimpleNotification(
          application.tasker_id,
          'Application Update',
          `Your application for "${selectedTaskForApplications?.title || 'Task'}" was not selected this time.`,
          'application_declined'
        )
      }

      Alert.alert('Success', 'Application declined.')
      setShowApplicationsModal(false)
      
      // Refresh applications for the current task
      if (selectedTaskForApplications) {
        handleViewApplications(selectedTaskForApplications)
      }
      
      refetch() // Refresh tasks
    } catch (error: any) {
      console.error('Error declining application:', error)
      Alert.alert('Error', 'Failed to decline application. Please try again.')
    }
  }

  const handleStartChat = async (task: any) => {
    if (!profile) return

    try {
      console.log('Starting chat for task:', task.id)
      
      // Determine the correct tasker_id
      let taskerId = profile.id
      if (profile.id === task.customer_id && task.tasker_id) {
        taskerId = task.tasker_id
      } else if (profile.id === task.tasker_id) {
        taskerId = profile.id
      }

      // Check if chat already exists
      const { data: existingChat, error: checkError } = await supabase
        .from('chats')
        .select('*')
        .eq('task_id', task.id)
        .eq('customer_id', task.customer_id)
        .eq('tasker_id', taskerId)
        .single()

      let chatId = ''

      if (existingChat && !checkError) {
        // Use existing chat
        chatId = existingChat.id
        console.log('Using existing chat:', chatId)
      } else {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            task_id: task.id,
            customer_id: task.customer_id,
            tasker_id: taskerId
          })
          .select('*')
          .single()

        if (createError) {
          console.error('Error creating chat:', createError)
          Alert.alert('Error', 'Failed to create chat. Please try again.')
          return
        }

        chatId = newChat.id
        console.log('Created new chat:', chatId)
      }

      // Set chat data and show modal
      setCurrentChatId(chatId)
      setCurrentTaskId(task.id)
      setCurrentCustomerId(task.customer_id)
      setCurrentTaskerId(taskerId)
      setShowChatModal(true)
      
    } catch (error: any) {
      console.error('Error starting chat:', error)
      Alert.alert('Error', 'Failed to start chat. Please try again.')
    }
  }

  const handleCloseApplicationModal = () => {
    setShowApplicationModal(false)
    setSelectedTask(null)
  }

  const handleCloseChatModal = () => {
    setShowChatModal(false)
    setCurrentChatId('')
    setCurrentTaskId('')
    setCurrentCustomerId('')
    setCurrentTaskerId('')
  }

  const handleCloseApplicationsModal = () => {
    setShowApplicationsModal(false)
    setSelectedTaskForApplications(null)
    setLoadingApplications(false)
  }

  const handleCloseTaskerProfileModal = () => {
    setShowTaskerProfileModal(false)
    setSelectedApplication(null)
  }

  const handleCloseChatDialog = () => {
    setShowChatDialog(false)
    setCurrentChat(null)
    // Note: selectChat expects a Chat object, so we can't pass null
    // The chat will be deselected when a new chat is selected or when the component unmounts
  }

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters)
  }

  const handleClearSearch = () => {
    setSearchFilters(null)
  }

  const handleEditTask = (task: any) => {
    // Navigate to edit task page or open edit modal

    // For now, we'll navigate to the post-task page with the task data
    // In a full implementation, you'd want a dedicated edit task page
    router.push({
      pathname: '/post-task',
      params: { 
        editMode: 'true',
        taskId: task.id,
        taskData: JSON.stringify(task)
      }
    })
  }

  const handleDeleteTask = async (task: any) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check if task has applications or is in progress
              if (task.tasker_id || task.status === 'in_progress') {
                Alert.alert(
                  'Cannot Delete',
                  'This task cannot be deleted because it has been assigned to a tasker or is currently in progress.',
                  [{ text: 'OK' }]
                )
                return
              }

              // Delete the task
              const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', task.id)

              if (error) {
                console.error('Error deleting task:', error)
                Alert.alert('Error', 'Failed to delete task. Please try again.')
                return
              }

              Alert.alert('Success', 'Task deleted successfully.')
              
              // Refresh the tasks list
              await refetch()
            } catch (error: any) {
              console.error('Error deleting task:', error)
              Alert.alert('Error', 'Failed to delete task. Please try again.')
            }
          }
        }
      ]
    )
  }

  const renderTask = ({ item }: { item: any }) => {
    const isOwner = profile?.id === item.customer_id
    const hasApplied = userApplications.has(item.id)
    
    // Check if chat should be available
    const canChat = (
      // Chat is available if:
      // 1. User is the assigned tasker (accepted application or direct booking), OR
      // 2. User is the customer and has an assigned tasker
      (item.tasker_id === profile?.id && (
        item.status === 'in_progress' || 
        item.status === 'confirmed' || 
        item.status === 'completed'
      )) ||
      // Customer can chat with assigned tasker
      (isOwner && item.tasker_id && (
        item.status === 'in_progress' || 
        item.status === 'confirmed' || 
        item.status === 'completed'
      ))
    )
    
    return (
      <TaskCard
        task={item}
        showActions={true}
        isOwner={isOwner}
        onApplyToTask={!isOwner && !hasApplied ? () => handleApplyToTask(item) : undefined}
        onViewApplications={isOwner ? () => handleViewApplications(item) : undefined}
        onEditTask={isOwner && !item.tasker_id && item.status === 'open' ? () => handleEditTask(item) : undefined}
        onDeleteTask={isOwner && !item.tasker_id && item.status === 'open' ? () => handleDeleteTask(item) : undefined}
        hasApplied={hasApplied}
        onStartChat={canChat ? () => handleStartChat(item) : undefined}
      />
    )
  }

  const applySearchFilters = (tasks: any[], filters: SearchFilters) => {
    let filteredTasks = [...tasks]

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase()
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.city.toLowerCase().includes(query) ||
        task.state.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (filters.category) {
      filteredTasks = filteredTasks.filter(task => 
        task.category_id === filters.category
      )
    }

    // Price range filter
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice)
      filteredTasks = filteredTasks.filter(task => task.budget >= minPrice)
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice)
      filteredTasks = filteredTasks.filter(task => task.budget <= maxPrice)
    }

    // Location filter
    if (filters.location) {
      const location = filters.location.toLowerCase()
      filteredTasks = filteredTasks.filter(task => 
        task.city.toLowerCase().includes(location) ||
        task.state.toLowerCase().includes(location) ||
        task.address.toLowerCase().includes(location)
      )
    }

    // Sort tasks
    switch (filters.sortBy) {
      case 'newest':
        filteredTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filteredTasks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'price_low':
        filteredTasks.sort((a, b) => a.budget - b.budget)
        break
      case 'price_high':
        filteredTasks.sort((a, b) => b.budget - a.budget)
        break
      case 'budget':
        filteredTasks.sort((a, b) => b.budget - a.budget)
        break
    }

    return filteredTasks
  }

  const getFilteredTasks = useMemo(() => {
    
    
    if (!tasks || tasks.length === 0) {

      return []
    }
    
    let baseTasks = []
    
    if (viewMode === 'my-tasks') {
      // Show tasks created by the current user, excluding completed tasks
      baseTasks = tasks.filter(task => {
        const isOwner = task.customer_id === profile?.id
        const isNotCompleted = task.status !== 'completed'

        return isOwner && isNotCompleted
      })

    } else {
      // Available Jobs: Show tasks that are available for application
      baseTasks = tasks.filter(task => {
        // Don't show user's own tasks
        if (task.customer_id === profile?.id) {

          return false
        }
        
        // Only show tasks that are still open for applications
        // Tasks with status 'open' are available (regardless of tasker_id)
        // Tasks with status 'assigned' are available only if no tasker_id is set
        // Tasks with status 'in_progress', 'completed', 'cancelled' are not available
        const isAvailable = task.status === 'open' || (task.status === 'assigned' && !task.tasker_id)

        return isAvailable
      })

    }

    // Apply search filters if any
    if (searchFilters) {
      baseTasks = applySearchFilters(baseTasks, searchFilters)
    }



    return baseTasks
  }, [tasks, viewMode, profile?.id, searchFilters])

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {viewMode === 'available' ? 'Available Jobs' : 'My Tasks'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.postButton}
            onPress={() => {
              router.push('/post-task')
            }}
          >
            <Ionicons name="add" size={20} color={Colors.text.inverse} />
            <Text style={styles.postButtonText}>Post Job</Text>
          </TouchableOpacity>
          <NotificationButton size={20} />
        </View>
      </View>

      {/* Search and Filter */}
      <SearchFilter
        onSearch={handleSearch}
        onClear={handleClearSearch}
        categories={categories}
      />

      {/* View Mode Toggle for Customers and Both Roles */}
      {(profile?.role === 'customer' || profile?.role === 'both') && (
        <View style={styles.viewModeContainer}>
                     <TouchableOpacity
             style={[
               styles.viewModeButton,
               viewMode === 'available' && styles.viewModeButtonActive
             ]}
             onPress={() => setViewMode('available')}
           >
            <Ionicons 
              name="globe" 
              size={16} 
              color={viewMode === 'available' ? Colors.text.inverse : Colors.text.secondary} 
            />
            <Text style={[
              styles.viewModeButtonText,
              viewMode === 'available' && styles.viewModeButtonTextActive
            ]}>
              Available Jobs
            </Text>
          </TouchableOpacity>
          
                     <TouchableOpacity
             style={[
               styles.viewModeButton,
               viewMode === 'my-tasks' && styles.viewModeButtonActive
             ]}
             onPress={() => setViewMode('my-tasks')}
           >
            <Ionicons 
              name="briefcase" 
              size={16} 
              color={viewMode === 'my-tasks' ? Colors.text.inverse : Colors.text.secondary} 
            />
            <Text style={[
              styles.viewModeButtonText,
              viewMode === 'my-tasks' && styles.viewModeButtonTextActive
            ]}>
              My Tasks
            </Text>
          </TouchableOpacity>
        </View>
      )}



      {/* Active Filters Indicator */}
      {searchFilters && (
        <View style={styles.activeFiltersContainer}>
          <View style={styles.activeFiltersContent}>
            <Ionicons name="filter" size={16} color={Colors.primary[500]} />
            <Text style={styles.activeFiltersText}>Filters applied</Text>
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearFiltersButton}>
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tasks List */}
      <FlatList
        data={getFilteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color={Colors.neutral[300]} />
            <Text style={styles.emptyStateText}>
              {searchFilters 
                ? 'No tasks match your search criteria'
                : viewMode === 'available' 
                  ? 'No available jobs' 
                  : 'No tasks posted yet'
              }
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchFilters
                ? 'Try adjusting your search filters'
                : viewMode === 'available' 
                  ? 'Check back later for new opportunities'
                  : 'Start by posting your first job'
              }
            </Text>
          </View>
        }
      />

      {/* Application Modal */}
      {showApplicationModal && selectedTask && (
        <TaskApplicationModal
          visible={showApplicationModal}
          onClose={handleCloseApplicationModal}
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          budget={selectedTask.budget || 0}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      )}

      {/* Applications Modal */}
      {showApplicationsModal && selectedTaskForApplications && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Applications</Text>
              <TouchableOpacity onPress={handleCloseApplicationsModal}>
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            {loadingApplications ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary[500]} />
                <Text style={styles.loadingText}>Loading applications...</Text>
              </View>
            ) : selectedTaskForApplications.applications && selectedTaskForApplications.applications.length > 0 ? (
              <FlatList
                data={selectedTaskForApplications.applications}
                renderItem={({ item }) => (
                  <TaskApplicationCard
                    application={item}
                    onAccept={() => handleAcceptApplication(item)}
                    onDecline={() => handleDeclineApplication(item)}
                    onViewProfile={() => handleViewTaskerProfile(item)}
                    isOwner={true}
                  />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.applicationsList}
              />
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
        </View>
      )}

             {/* Tasker Profile Modal */}
       {showTaskerProfileModal && selectedApplication && (
         <TaskerProfileModal
           visible={showTaskerProfileModal}
           onClose={handleCloseTaskerProfileModal}
           taskerProfile={selectedApplication.tasker_profile}
         />
       )}

      {/* Simple Chat Modal */}
      <SimpleChatModal
        visible={showChatModal}
        chatId={currentChatId}
        taskId={currentTaskId}
        customerId={currentCustomerId}
        taskerId={currentTaskerId}
        onClose={handleCloseChatModal}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  postButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.background.primary,
    gap: Spacing.xs,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  viewModeButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  viewModeButtonTextActive: {
    color: Colors.text.inverse,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  modalOverlay: {
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
  modalContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    margin: Spacing.lg,
    maxHeight: '80%',
    width: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  applicationsList: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  activeFiltersContainer: {
    backgroundColor: Colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[100],
  },
  activeFiltersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  activeFiltersText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.medium,
  },
  clearFiltersButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearFiltersText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

})
