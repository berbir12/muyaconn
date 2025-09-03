import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import WorkProgressCard from '../components/WorkProgressCard'
import SimpleChatModal from '../components/SimpleChatModal'
import { supabase } from '../lib/supabase'

interface ActiveWorkItem {
  id: string
  type: 'task'
  title: string
  status: string
  otherPartyName: string
  startDate: string
  estimatedDuration?: number
  data: any // Original data object
}

export default function ActiveWorkScreen() {
  const { profile } = useAuth()
  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks()
  const [activeWork, setActiveWork] = useState<ActiveWorkItem[]>([])
  const [showChatModal, setShowChatModal] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string>('')
  const [currentTaskId, setCurrentTaskId] = useState<string>('')
  const [currentCustomerId, setCurrentCustomerId] = useState<string>('')
  const [currentTaskerId, setCurrentTaskerId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Combine tasks into active work items
  useEffect(() => {
    if (!profile || !tasks) return

    const workItems: ActiveWorkItem[] = []

    // Add accepted tasks (in_progress, confirmed, completed)
    tasks.forEach(task => {
      if (task.customer_id === profile.id && task.tasker_id && 
          ['in_progress', 'confirmed', 'completed'].includes(task.status)) {
        workItems.push({
          id: task.id,
          type: 'task',
          title: task.title,
          status: task.status,
          otherPartyName: task.tasker_profile?.full_name || 'Unknown Tasker',
          startDate: task.created_at,
          estimatedDuration: task.estimated_hours,
          data: task
        })
      }
    })

    // Sort by most recent
    workItems.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    setActiveWork(workItems)
  }, [profile, tasks])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await refetchTasks()
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = async (workItem: ActiveWorkItem) => {
    if (!profile) return

    try {
      console.log('Starting chat for work item:', workItem.id)
      
      // Determine the correct tasker_id
      let taskerId = profile.id
      if (profile.id === workItem.data.customer_id && workItem.data.tasker_id) {
        taskerId = workItem.data.tasker_id
      } else if (profile.id === workItem.data.tasker_id) {
        taskerId = profile.id
      }

      // Check if chat already exists
      const { data: existingChat, error: checkError } = await supabase
        .from('chats')
        .select('*')
        .eq('task_id', workItem.id)
        .eq('customer_id', workItem.data.customer_id)
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
            task_id: workItem.id,
            customer_id: workItem.data.customer_id,
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
      setCurrentTaskId(workItem.id)
      setCurrentCustomerId(workItem.data.customer_id)
      setCurrentTaskerId(taskerId)
      setShowChatModal(true)
      
    } catch (error: any) {
      console.error('Error starting chat:', error)
      Alert.alert('Error', 'Failed to start chat. Please try again.')
    }
  }

  const handleViewDetails = (workItem: ActiveWorkItem) => {
    if (workItem.type === 'task') {
      // Navigate to task details
      Alert.alert('Info', 'Task details view will be available soon.')
    }
  }

  const handleCloseChatModal = () => {
    setShowChatModal(false)
    setCurrentChatId('')
    setCurrentTaskId('')
    setCurrentCustomerId('')
    setCurrentTaskerId('')
  }

  const renderWorkItem = ({ item }: { item: ActiveWorkItem }) => (
    <WorkProgressCard
      type={item.type}
      title={item.title}
      status={item.status}
      otherPartyName={item.otherPartyName}
      startDate={item.startDate}
      estimatedDuration={item.estimatedDuration}
      onUpdateStatus={() => {}} // No status updates needed for active work view
      onChat={() => handleStartChat(item)}
      onViewDetails={() => handleViewDetails(item)}
    />
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle" size={64} color={Colors.neutral[300]} />
      <Text style={styles.emptyStateText}>No Active Work</Text>
      <Text style={styles.emptyStateSubtext}>
        You don't have any active tasks right now.{'\n'}
        Check the Jobs tab to find work or post new tasks.
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Work</Text>
        <Text style={styles.headerSubtitle}>
          Track your ongoing tasks
        </Text>
      </View>

      {/* Work List */}
      <FlatList
        data={activeWork}
        renderItem={renderWorkItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={loading || tasksLoading} 
            onRefresh={handleRefresh}
            colors={[Colors.primary[500]]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

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
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
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

})
