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
  Image,
  Modal,
  ScrollView,
  ActionSheetIOS,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { Chat, ChatMessage } from '../types/chat'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ImageUploadService } from '../services/ImageUploadService'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface EnhancedChatInterfaceProps {
  chat: Chat
  messages: ChatMessage[]
  onSendMessage: (message: string, messageType?: string, fileUrl?: string, fileName?: string) => Promise<void>
  onBack: () => void
  loading?: boolean
}

interface TypingUser {
  id: string
  name: string
  isTyping: boolean
}

export default function EnhancedChatInterface({ 
  chat, 
  messages, 
  onSendMessage, 
  onBack, 
  loading = false 
}: EnhancedChatInterfaceProps) {
  const { profile } = useAuth()
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [chatData, setChatData] = useState<any>(null)
  const [loadingChatData, setLoadingChatData] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

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

  // Handle search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = messages.filter(message =>
        message.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredMessages(filtered)
    } else {
      setFilteredMessages(messages)
    }
  }, [searchQuery, messages])

  // Typing indicator logic
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      // Send typing indicator to other users
      // This would typically be done via WebSocket or real-time subscription
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  const otherUser = profile?.id === chat.customer_id ? chatData?.tasker_profile : chatData?.customer_profile
  const taskTitle = chatData?.task?.title || 'Untitled Task'
  const taskStatus = chatData?.task?.status || 'unknown'
  const otherUserName = otherUser?.full_name || 'Unknown User'
  // Chat is active if explicitly marked as active OR if task status indicates it should be active
  const isActive = chat.is_active || (taskStatus && !['completed', 'cancelled'].includes(taskStatus))

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

  const handleSendMessage = async (messageType: string = 'text', fileUrl?: string, fileName?: string) => {
    const message = messageType === 'text' ? messageText.trim() : ''
    if (!message && !fileUrl || sending || !isActive) return

    try {
      setSending(true)
      // Call the onSendMessage with the correct parameters
      await onSendMessage(message, messageType, fileUrl, fileName)
      if (messageType === 'text') {
        setMessageText('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      Alert.alert('Error', 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleImagePicker = async () => {

    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]

        
        // Show loading indicator
        setUploadingFile(true)
        
        const fileUrl = await ImageUploadService.uploadImage(
          asset.uri,
          'chat-images',
          'messages'
        )
        

        await handleSendMessage('image', fileUrl, asset.fileName || 'image.jpg')
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleCameraCapture = async () => {

    try {
      // Request camera permissions first
      const { status } = await ImagePicker.requestCameraPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your camera.')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]

        
        // Show loading indicator
        setUploadingFile(true)
        
        const fileUrl = await ImageUploadService.uploadImage(
          asset.uri,
          'chat-images',
          'messages'
        )
        

        await handleSendMessage('image', fileUrl, 'camera-image.jpg')
      }
    } catch (error) {
      console.error('Error capturing image:', error)
      Alert.alert('Error', 'Failed to capture image. Please try again.')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDocumentPicker = async () => {

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })


      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]

        
        // Show loading indicator
        setUploadingFile(true)
        
        // Upload document to storage
        const fileUrl = await ImageUploadService.uploadImage(
          asset.uri,
          'chat-documents',
          'messages'
        )
        

        await handleSendMessage('file', fileUrl, asset.name || 'document')
      }
    } catch (error) {
      console.error('Error picking document:', error)
      Alert.alert('Error', 'Failed to pick document. Please try again.')
    } finally {
      setUploadingFile(false)
    }
  }

  const showAttachmentModal = () => {

    if (Platform.OS === 'ios') {

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Camera', 'Photo Library', 'Documents'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {

          switch (buttonIndex) {
            case 1:

              handleCameraCapture()
              break
            case 2:

              handleImagePicker()
              break
            case 3:

              handleDocumentPicker()
              break
          }
        }
      )
    } else {

      setShowAttachmentOptions(true)
    }
  }



  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all messages in this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement clear chat functionality

            setShowChatMenu(false)
          }
        }
      ]
    )
  }

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You will no longer be able to send or receive messages from them.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement block user functionality

            setShowChatMenu(false)
          }
        }
      ]
    )
  }

  const showChatMenuModal = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Clear Chat History', 'Block User'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleClearChat()
          } else if (buttonIndex === 2) {
            handleBlockUser()
          }
        }
      )
    } else {
      setShowChatMenu(true)
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

  const getMessageStatusIcon = (message: ChatMessage) => {
    if (message.sender_id !== profile?.id) return null
    
    if (message.read_at) {
      return <Ionicons name="checkmark-done" size={14} color={Colors.success[500]} />
    } else if (message.delivered_at) {
      return <Ionicons name="checkmark-done" size={14} color={Colors.text.tertiary} />
    } else {
      return <Ionicons name="checkmark" size={14} color={Colors.text.tertiary} />
    }
  }

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMyMessage = item.sender_id === profile?.id
    const showTime = index === 0 || 
      new Date(item.created_at).getTime() - new Date((showSearch ? filteredMessages : messages)[index - 1].created_at).getTime() > 5 * 60 * 1000

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
          {item.message_type === 'image' && item.file_url && (
            <Image source={{ uri: item.file_url }} style={styles.messageImage} />
          )}
          
          {item.message_type === 'file' && (
            <View style={styles.fileMessage}>
              <Ionicons name="document" size={24} color={Colors.primary[500]} />
              <Text style={styles.fileName} numberOfLines={1}>
                {item.file_name || 'Document'}
              </Text>
            </View>
          )}
          
          {item.message && (
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {(() => {
                // Handle different message formats
                if (typeof item.message === 'string') {
                  return item.message
                } else if (typeof item.message === 'object' && item.message !== null) {
                  // If it's an object, try to extract the message field
                  if ('message' in item.message && typeof item.message.message === 'string') {
                    return item.message.message
                  }
                  // Fallback to stringify if we can't extract the message
                  return JSON.stringify(item.message)
                }
                return String(item.message)
              })()}
            </Text>
          )}
          
          <View style={[
            styles.messageMeta,
            isMyMessage ? styles.myMessageMeta : styles.otherMessageMeta
          ]}>
            <Text style={styles.messageTime}>
              {formatMessageTime(item.created_at)}
            </Text>
            {getMessageStatusIcon(item)}
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

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null
    
    return (
      <View style={styles.typingIndicator}>
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>
            {typingUsers.map(user => user.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </Text>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    )
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if ((showSearch ? filteredMessages : messages).length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length, filteredMessages.length])

  if (loadingChatData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
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
          <Text style={styles.chatDescription}>
            Discuss task details and coordinate with your {profile?.id === chat.customer_id ? 'tasker' : 'customer'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={showChatMenuModal}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => setShowSearch(false)}>
            <Ionicons name="close" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={showSearch ? filteredMessages : messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        {renderTypingIndicator()}
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
          <TouchableOpacity
            style={[
              styles.attachButton, 
              (!isActive || uploadingFile) && styles.attachButtonDisabled
            ]}
            onPress={() => {

              if (isActive && !uploadingFile) {
                showAttachmentModal()
              } else {

              }
            }}
            disabled={!isActive || uploadingFile}
          >
            <Ionicons 
              name={uploadingFile ? "cloud-upload" : "attach"} 
              size={20} 
              color={uploadingFile ? Colors.text.tertiary : Colors.primary[500]} 
            />
          </TouchableOpacity>
          
          <TextInput
            style={[
              styles.messageInput,
              !isActive && styles.messageInputDisabled
            ]}
            placeholder={!isActive ? "Chat disabled - task completed" : "Type a message..."}
            placeholderTextColor={!isActive ? Colors.text.tertiary : Colors.text.tertiary}
            value={messageText}
            onChangeText={(text) => {
              setMessageText(text)
              handleTyping()
            }}
            multiline
            maxLength={1000}
            editable={isActive && !sending}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sending || uploadingFile || !isActive) && styles.sendButtonDisabled
          ]}
          onPress={() => handleSendMessage('text')}
          disabled={!messageText.trim() || sending || uploadingFile || !isActive}
        >
          {uploadingFile ? (
            <Ionicons name="cloud-upload" size={20} color={Colors.text.inverse} />
          ) : sending ? (
            <Ionicons name="hourglass" size={20} color={Colors.text.inverse} />
          ) : !isActive ? (
            <Ionicons name="lock-closed" size={20} color={Colors.text.inverse} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.text.inverse} />
          )}
        </TouchableOpacity>
      </View>

      {/* Attachment Options Modal (Android) */}
      <Modal
        visible={showAttachmentOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachmentOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachmentOptions(false)}
        >
          <TouchableOpacity
            style={styles.attachmentModal}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Attach File</Text>
            <TouchableOpacity style={styles.attachmentOption} onPress={handleCameraCapture}>
              <Ionicons name="camera" size={24} color={Colors.primary[500]} />
              <Text style={styles.attachmentOptionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={handleImagePicker}>
              <Ionicons name="image" size={24} color={Colors.primary[500]} />
              <Text style={styles.attachmentOptionText}>Photo Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={handleDocumentPicker}>
              <Ionicons name="document" size={24} color={Colors.primary[500]} />
              <Text style={styles.attachmentOptionText}>Documents</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowAttachmentOptions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Chat Menu Modal (Android) */}
      <Modal
        visible={showChatMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChatMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChatMenu(false)}
        >
          <View style={styles.chatMenuContainer}>
            <Text style={styles.modalTitle}>Chat Options</Text>
            

            <TouchableOpacity style={styles.menuOption} onPress={handleClearChat}>
              <Ionicons name="trash-outline" size={24} color={Colors.warning[500]} />
              <Text style={styles.menuOptionText}>Clear Chat History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuOption} onPress={handleBlockUser}>
              <Ionicons name="ban-outline" size={24} color={Colors.error[500]} />
              <Text style={[styles.menuOptionText, { color: Colors.error[500] }]}>Block User</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowChatMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
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
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  fileName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
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
  typingIndicator: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    maxWidth: '80%',
    gap: Spacing.sm,
  },
  typingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 2,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.text.tertiary,
  },
  typingDot1: {
    animationDelay: '0s',
  },
  typingDot2: {
    animationDelay: '0.2s',
  },
  typingDot3: {
    animationDelay: '0.4s',
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
  chatDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentModal: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  attachmentOptionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  cancelButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  chatMenuContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '80%',
    maxWidth: 300,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuOptionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
})
