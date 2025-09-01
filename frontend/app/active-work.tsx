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
import { useChat } from '../hooks/useChat'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import WorkProgressCard from '../components/WorkProgressCard'
import ChatInterface from '../components/ChatInterface'

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
  const { createChat, chats, messages, sendMessage, selectChat } = useChat()
  
  const [activeWork, setActiveWork] = useState<ActiveWorkItem[]>([])
  const [showChatDialog, setShowChatDialog] = useState(false)
  const [currentChat, setCurrentChat] = useState<any>(null)
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
      // For tasks, create or find existing chat
      const existingChat = chats.find(chat => 
        chat.task_id === workItem.id && 
        (chat.customer_id === profile.id || chat.tasker_id === profile.id)
      )

      if (existingChat) {
        setCurrentChat(existingChat)
        setShowChatDialog(true)
        return
      }

      // Create new chat if needed
      Alert.alert('Info', 'Chat creation will be available soon.')
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

      {/* Chat Dialog */}
      {showChatDialog && currentChat && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.chatModalContainer]}>
            <ChatInterface
              chat={currentChat}
              messages={messages}
              onSendMessage={async (message: string) => {
                try {
                  await sendMessage({
                    chat_id: currentChat.id,
                    message,
                    message_type: 'text'
                  })
                } catch (error) {
                  console.error('Error sending message:', error)
                }
              }}
              onBack={() => {
                setShowChatDialog(false)
                setCurrentChat(null)
              }}
              loading={false}
            />
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
  chatModalContainer: {
    maxHeight: '90%',
    width: '95%',
    margin: Spacing.sm,
  },
})
