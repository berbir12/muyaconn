import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface SimpleChatInterfaceProps {
  chat: any
  onBack: () => void
}

interface ChatMessage {
  id: string
  chat_id: string
  sender_id: string
  message: string
  message_type: string
  created_at: string
}

export default function SimpleChatInterface({
  chat,
  onBack
}: SimpleChatInterfaceProps) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [chatData, setChatData] = useState<any>(null)
  const flatListRef = useRef<FlatList>(null)

  // Fetch messages when component mounts
  useEffect(() => {
    if (chat?.id) {
      fetchMessages()
      fetchChatData()
    }
  }, [chat?.id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  const fetchChatData = async () => {
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

      // Fetch task info
      const { data: taskData } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('id', chat.task_id)
        .single()

      setChatData({
        customer_profile: customerProfile,
        tasker_profile: taskerProfile,
        task: taskData
      })
    } catch (error) {
      console.error('Error fetching chat data:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        Alert.alert('Error', 'Failed to load messages')
        return
      }

      console.log('Fetched messages from database:', data)
      if (data && data.length > 0) {
        console.log('First message:', data[0])
        console.log('First message text:', data[0].message)
        console.log('First message type:', typeof data[0].message)
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      Alert.alert('Error', 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile) return

    try {
      setSending(true)
      
      const messageText = newMessage.trim()
      console.log('Sending message text:', messageText)
      console.log('Message type:', typeof messageText)
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chat.id,
          sender_id: profile.id,
          message: messageText,
          message_type: 'text'
        })
        .select('*')
        .single()

      if (error) {
        console.error('Error sending message:', error)
        Alert.alert('Error', 'Failed to send message')
        return
      }

      console.log('Message sent successfully:', data)
      console.log('Returned message field:', data.message)
      console.log('Returned message type:', typeof data.message)

      // Add message to local state
      setMessages(prev => [...prev, data])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      Alert.alert('Error', 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.sender_id === profile?.id
    
    // Ensure message is displayed as text, not JSON
    let displayMessage = item.message
    if (typeof displayMessage === 'object') {
      console.log('Message is object, converting to string:', displayMessage)
      displayMessage = JSON.stringify(displayMessage)
    } else if (typeof displayMessage !== 'string') {
      console.log('Message is not string, converting:', displayMessage)
      displayMessage = String(displayMessage)
    }
    
    console.log('Rendering message:', displayMessage)
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <Text style={[
          styles.messageText,
          isMyMessage ? styles.myMessageText : styles.otherMessageText
        ]}>
          {displayMessage}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    )
  }

  const otherUser = profile?.id === chat?.customer_id ? chatData?.tasker_profile : chatData?.customer_profile
  const taskTitle = chatData?.task?.title || 'Untitled Task'
  const taskStatus = chatData?.task?.status || 'unknown'
  const otherUserName = otherUser?.full_name || 'Unknown User'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return Colors.primary[500]
      case 'completed': return Colors.success[500]
      case 'cancelled': return Colors.error[500]
      default: return Colors.neutral[400]
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{otherUserName}</Text>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{taskTitle}</Text>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(taskStatus) }]} />
              <Text style={styles.taskStatus}>{taskStatus}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={Colors.text.tertiary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.text.inverse} />
            ) : (
              <Ionicons name="send" size={20} color={Colors.text.inverse} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
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
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  taskTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginRight: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  taskStatus: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  moreButton: {
    padding: Spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary[500],
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.neutral[100],
  },
  messageText: {
    fontSize: Typography.fontSize.md,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.text.inverse,
  },
  otherMessageText: {
    color: Colors.text.primary,
  },
  messageTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    backgroundColor: Colors.background.primary,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
})
