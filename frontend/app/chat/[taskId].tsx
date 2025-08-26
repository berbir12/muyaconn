import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import ChatBubble from '../../components/ui/ChatBubble'
import MessageInput from '../../components/MessageInput'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Colors from '../../constants/Colors'
import { Spacing, BorderRadius, Typography, Shadows, CommonStyles } from '../../constants/Design'

interface Message {
  id: string
  task_id: string
  sender_id: string
  recipient_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  read: boolean
  created_at: string
  updated_at: string
  
  // Joined data
  sender_profile?: {
    full_name: string
    username: string
    avatar_url?: string
  }
}

interface Task {
  id: string
  title: string
  status: string
  customer_id: string
  tasker_id?: string
  customer_profile?: {
    full_name: string
    username: string
  }
  tasker_profile?: {
    full_name: string
    username: string
  }
}

export default function ChatScreen() {
  const { taskId, partnerId } = useLocalSearchParams()
  const { profile } = useAuth()
  const [task, setTask] = useState<Task | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const flatListRef = useRef<FlatList>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Animation for screen entrance
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [])

  // Fetch task and initial messages
  useEffect(() => {
    if (taskId) {
      fetchTaskDetails()
      fetchMessages()
    }
  }, [taskId])

  // Set up real-time message subscription
  useEffect(() => {
    if (!taskId || !profile) return

    const subscription = supabase
      .channel(`chat-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          console.log('Real-time message update:', payload)
          handleRealtimeMessage(payload)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [taskId, profile])

  const fetchTaskDetails = async () => {
    try {
      // In fallback mode, create mock task data
      const mockTask: Task = {
        id: taskId as string,
        title: 'Help with Furniture Assembly',
        status: 'assigned',
        customer_id: 'customer-123',
        tasker_id: 'tasker-456',
        customer_profile: {
          full_name: 'John Smith',
          username: 'johnsmith'
        },
        tasker_profile: {
          full_name: 'Sarah Wilson',
          username: 'sarahwilson'
        }
      }
      setTask(mockTask)
    } catch (error: any) {
      console.error('Error fetching task:', error)
      Alert.alert('Error', 'Failed to load task details')
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      
      // Mock messages for demonstration
      const mockMessages: Message[] = [
        {
          id: '1',
          task_id: taskId as string,
          sender_id: 'customer-123',
          recipient_id: 'tasker-456',
          content: 'Hi! I need help assembling my new IKEA bookshelf. When would you be available?',
          message_type: 'text',
          read: true,
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          sender_profile: {
            full_name: 'John Smith',
            username: 'johnsmith'
          }
        },
        {
          id: '2',
          task_id: taskId as string,
          sender_id: 'tasker-456',
          recipient_id: 'customer-123',
          content: 'Hello John! I can help you with that. I\'m available this afternoon around 2 PM. Would that work for you?',
          message_type: 'text',
          read: true,
          created_at: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
          updated_at: new Date(Date.now() - 3000000).toISOString(),
          sender_profile: {
            full_name: 'Sarah Wilson',
            username: 'sarahwilson'
          }
        },
        {
          id: '3',
          task_id: taskId as string,
          sender_id: 'customer-123',
          recipient_id: 'tasker-456',
          content: 'Perfect! 2 PM works great. I have all the tools ready. The address is 123 Main St.',
          message_type: 'text',
          read: true,
          created_at: new Date(Date.now() - 2400000).toISOString(), // 40 minutes ago
          updated_at: new Date(Date.now() - 2400000).toISOString(),
          sender_profile: {
            full_name: 'John Smith',
            username: 'johnsmith'
          }
        },
        {
          id: '4',
          task_id: taskId as string,
          sender_id: 'system',
          recipient_id: 'both',
          content: 'Sarah has accepted this task and will arrive at 2:00 PM today.',
          message_type: 'system',
          read: true,
          created_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          updated_at: new Date(Date.now() - 1800000).toISOString(),
        },
      ]
      
      setMessages(mockMessages)
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      Alert.alert('Error', 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleRealtimeMessage = (payload: any) => {
    console.log('Handling real-time message:', payload)
    
    if (payload.eventType === 'INSERT') {
      const newMessage = payload.new as Message
      setMessages(prev => [...prev, newMessage])
      
      // Mark message as read if it's not from current user
      if (newMessage.sender_id !== profile?.id) {
        markMessageAsRead(newMessage.id)
      }
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    try {
      if (supabase) {
        await supabase
          .from('messages')
          .update({ read: true, updated_at: new Date().toISOString() })
          .eq('id', messageId)
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const sendMessage = async (content: string) => {
    if (!profile || !taskId || !partnerId) return
    
    try {
      setSendingMessage(true)
      
      const newMessage: Message = {
        id: Date.now().toString(), // Temporary ID
        task_id: taskId as string,
        sender_id: profile.id,
        recipient_id: partnerId as string,
        content: content.trim(),
        message_type: 'text',
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender_profile: {
          full_name: profile.full_name,
          username: profile.username
        }
      }
      
      // Optimistically add message to UI
      setMessages(prev => [...prev, newMessage])
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)

      // In a real app, this would send to Supabase:
      // const { data, error } = await supabase
      //   .from('messages')
      //   .insert(newMessage)
      
      console.log('Message sent:', content)
      
    } catch (error: any) {
      console.error('Error sending message:', error)
      Alert.alert('Error', 'Failed to send message')
      
      // Remove optimistically added message on error
      setMessages(prev => prev.filter(m => m.id !== newMessage.id))
    } finally {
      setSendingMessage(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchMessages()
    setRefreshing(false)
  }

  const getOtherUser = () => {
    if (!task || !profile) return null
    
    if (profile.role === 'customer') {
      return task.tasker_profile
    } else {
      return task.customer_profile
    }
  }

  const otherUser = getOtherUser()
  const isCurrentUser = (message: Message) => message.sender_id === profile?.id

  const renderMessage = ({ item: message, index }: { item: Message; index: number }) => {
    // System messages
    if (message.message_type === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
            <Ionicons name="information-circle" size={16} color={Colors.primary[600]} />
            <Text style={styles.systemMessageText}>{message.content}</Text>
          </View>
        </View>
      )
    }

    const isCurrentUserMessage = isCurrentUser(message)
    const isFirstInGroup = index === 0 || 
      messages[index - 1].sender_id !== message.sender_id || 
      messages[index - 1].message_type === 'system'
    const isLastInGroup = index === messages.length - 1 || 
      messages[index + 1].sender_id !== message.sender_id ||
      messages[index + 1].message_type === 'system'

    return (
      <ChatBubble
        message={message}
        isCurrentUser={isCurrentUserMessage}
        isFirstInGroup={isFirstInGroup}
        isLastInGroup={isLastInGroup}
        showAvatar={!isCurrentUserMessage}
      />
    )
  }

  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>
            {Array.from(typingUsers).join(', ')} is typing...
          </Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary[500], Colors.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Button
            title=""
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
            icon="arrow-back"
            style={styles.backButton}
          />
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{otherUser?.full_name || 'Chat'}</Text>
            <Text style={styles.headerSubtitle}>
              {task?.title || 'Task Chat'}
            </Text>
          </View>
          
          <Button
            title=""
            onPress={() => {
              Alert.alert(
                'Chat Options',
                'Choose an action',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'View Task Details', onPress: () => router.push(`/task/${taskId}`) },
                  { text: 'Report Issue', onPress: () => console.log('Report') },
                ]
              )
            }}
            variant="ghost"
            size="sm"
            icon="ellipsis-vertical"
            style={styles.optionsButton}
          />
        </View>
      </LinearGradient>

      <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true })
          }}
          ListEmptyComponent={
            <Card style={styles.emptyState}>
              <View style={styles.emptyStateContent}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.neutral[400]} />
                <Text style={styles.emptyStateText}>No messages yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start the conversation with {otherUser?.full_name}
                </Text>
              </View>
            </Card>
          }
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Message Input */}
        <MessageInput
          onSendMessage={sendMessage}
          placeholder={`Message ${otherUser?.full_name}...`}
          loading={sendingMessage}
        />
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  header: {
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    opacity: 0.8,
    marginTop: 2,
  },
  optionsButton: {
    marginLeft: Spacing.md,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  messagesContent: {
    paddingVertical: Spacing.lg,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  systemMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  systemMessageText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  typingContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  typingBubble: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  typingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyState: {
    margin: Spacing.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
})