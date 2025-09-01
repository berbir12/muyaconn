import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Chat, ChatMessage } from '../types/chat'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface ChatInterfaceProps {
  chat: Chat
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  onBack: () => void
  loading?: boolean
}

export default function ChatInterface({ 
  chat, 
  messages, 
  onSendMessage, 
  onBack, 
  loading = false 
}: ChatInterfaceProps) {
  const { profile } = useAuth()
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [chatData, setChatData] = useState<any>(null)
  const [loadingChatData, setLoadingChatData] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  // Fetch chat data (profiles, task info) when component mounts
  useEffect(() => {
    const fetchChatData = async () => {
      if (!chat) return
      
      setLoadingChatData(true)
      try {
        // Fetch customer profile
        const { data: customerProfile } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .eq('id', chat.customer_id)
          .single()
        
        // Fetch tasker profile
        const { data: taskerProfile } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .eq('id', chat.tasker_id)
          .single()

        setChatData({
          customer_profile: customerProfile,
          tasker_profile: taskerProfile,
          task: chat.task
        })
      } catch (error) {
        console.error('Error fetching chat data:', error)
      } finally {
        setLoadingChatData(false)
      }
    }

    fetchChatData()
  }, [chat])

  const otherUser = profile?.id === chat.customer_id ? chatData?.tasker_profile : chatData?.customer_profile
  const taskTitle = chatData?.task?.title || 'Untitled Task'
  const taskStatus = chatData?.task?.status || 'unknown'
  const otherUserName = otherUser?.full_name || 'Unknown User'
  const isActive = chat.is_active

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return Colors.success[500]
      case 'in_progress': return Colors.primary[500]
      case 'confirmed': return Colors.warning[500]
      case 'completed': return Colors.success[500]
      case 'cancelled': return Colors.error[500]
      default: return Colors.neutral[400]
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return 'checkmark-circle'
      case 'in_progress': return 'play-circle'
      case 'confirmed': return 'checkmark-circle'
      case 'completed': return 'checkmark-done-circle'
      case 'cancelled': return 'close-circle'
      default: return 'help-circle'
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending || !isActive) return

    try {
      setSending(true)
      await onSendMessage(messageText.trim())
      setMessageText('')
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMyMessage = item.sender_id === profile?.id
    const showTime = index === 0 || 
      new Date(item.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 5 * 60 * 1000

    return (
      <View style={styles.messageContainer}>
        {showTime && (
          <View style={styles.timeDivider}>
            <Text style={styles.timeDividerText}>
              {formatMessageTime(item.created_at)}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.otherMessage
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          
          <View style={[
            styles.messageMeta,
            isMyMessage ? styles.myMessageMeta : styles.otherMessageMeta
          ]}>
            <Text style={styles.messageTime}>
              {formatMessageTime(item.created_at)}
            </Text>
            {isMyMessage && (
              <Ionicons 
                name={item.read_at ? "checkmark-done" : "checkmark"} 
                size={14} 
                color={item.read_at ? Colors.success[500] : Colors.text.tertiary} 
              />
            )}
          </View>
        </View>
      </View>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={Colors.neutral[300]} />
      <Text style={styles.emptyStateText}>
        {!isActive ? 'Chat disabled' : 'Start the conversation'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {!isActive 
          ? 'This chat is no longer active because the task has been completed or cancelled'
          : 'Send the first message to begin discussing this task'
        }
      </Text>
    </View>
  )

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  if (loadingChatData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {otherUserName}
          </Text>
          <Text style={styles.headerSubtitle}>
            {taskTitle}
          </Text>
          <View style={styles.statusRow}>
            <Ionicons 
              name={getStatusIcon(taskStatus) as any} 
              size={16} 
              color={getStatusColor(taskStatus)} 
            />
            <Text style={[
              styles.statusText,
              { color: getStatusColor(taskStatus) }
            ]}>
              {taskStatus.replace('_', ' ')}
            </Text>
            {!isActive && (
              <Text style={styles.inactiveBadge}>Chat Disabled</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      </KeyboardAvoidingView>

      {/* Message Input */}
      <View style={[
        styles.inputContainer,
        !isActive && styles.inputContainerDisabled
      ]}>
        <View style={[
          styles.inputWrapper,
          !isActive && styles.inputWrapperDisabled
        ]}>
          <TextInput
            style={[
              styles.messageInput,
              !isActive && styles.messageInputDisabled
            ]}
            placeholder={!isActive ? "Chat disabled - task completed" : "Type a message..."}
            placeholderTextColor={!isActive ? Colors.text.tertiary : Colors.text.tertiary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            editable={isActive && !sending}
          />
          
          <TouchableOpacity
            style={[
              styles.attachButton, 
              (!messageText.trim() || !isActive) && styles.attachButtonDisabled
            ]}
            disabled={!messageText.trim() || !isActive}
          >
            <Ionicons name="attach" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sending || !isActive) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending || !isActive}
        >
          {sending ? (
            <Ionicons name="hourglass" size={20} color={Colors.text.inverse} />
          ) : !isActive ? (
            <Ionicons name="lock-closed" size={20} color={Colors.text.inverse} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.text.inverse} />
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.background.primary,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  moreButton: {
    padding: Spacing.xs,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  messageContainer: {
    marginBottom: Spacing.sm,
  },
  timeDivider: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  timeDividerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary[500],
    borderBottomRightRadius: BorderRadius.sm,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background.secondary,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  messageText: {
    fontSize: Typography.fontSize.md,
    lineHeight: 22,
  },
  myMessageText: {
    color: Colors.text.inverse,
  },
  otherMessageText: {
    color: Colors.text.primary,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  myMessageMeta: {
    justifyContent: 'flex-end',
  },
  otherMessageMeta: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    backgroundColor: Colors.background.primary,
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  messageInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    maxHeight: 100,
    minHeight: 20,
    textAlignVertical: 'top',
    paddingTop: 0,
    paddingBottom: 0,
  },
  attachButton: {
    padding: Spacing.xs,
  },
  attachButtonDisabled: {
    opacity: 0.5,
  },
  sendButton: {
    backgroundColor: Colors.primary[500],
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.neutral[400],
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
     inactiveBadge: {
     backgroundColor: Colors.error[100],
     color: Colors.error[800],
     fontSize: Typography.fontSize.xs,
     fontWeight: Typography.fontWeight.semibold,
     paddingHorizontal: Spacing.xs,
     paddingVertical: Spacing.xs,
     borderRadius: BorderRadius.sm,
     borderWidth: 1,
     borderColor: Colors.error[300],
   },
  inputContainerDisabled: {
    opacity: 0.7,
  },
  inputWrapperDisabled: {
    opacity: 0.7,
  },
  messageInputDisabled: {
    opacity: 0.7,
  },
})
