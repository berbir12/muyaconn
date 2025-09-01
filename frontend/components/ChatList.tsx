import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Chat } from '../types/chat'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface ChatListProps {
  chats: Chat[]
  onSelectChat: (chat: Chat) => void
  loading?: boolean
}

export default function ChatList({ chats, onSelectChat, loading = false }: ChatListProps) {
  const { profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [showActiveOnly, setShowActiveOnly] = useState(true) // Default to showing only active chats
  const [chatProfiles, setChatProfiles] = useState<Record<string, any>>({})
  const [loadingProfiles, setLoadingProfiles] = useState(false)

  // Fetch profile data for chats
  useEffect(() => {
    const fetchProfiles = async () => {
      if (chats.length === 0) return
      
      setLoadingProfiles(true)
      const profiles: Record<string, any> = {}
      
      try {
        for (const chat of chats) {
          // Fetch customer profile
          if (chat.customer_id) {
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

            // Fetch last message
            const { data: lastMessage } = await supabase
              .from('chat_messages')
              .select('id, message, message_type, created_at, sender_id')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            profiles[chat.id] = {
              customer_profile: customerProfile,
              tasker_profile: taskerProfile,
              last_message: lastMessage
            }
          }
        }
        
        setChatProfiles(profiles)
      } catch (error) {
        console.error('Error fetching chat profiles:', error)
      } finally {
        setLoadingProfiles(false)
      }
    }

    fetchProfiles()
  }, [chats])

  const filteredChats = chats.filter(chat => {
    const chatData = chatProfiles[chat.id]
    if (!chatData) return false
    
    const otherUser = profile?.id === chat.customer_id ? chatData.tasker_profile : chatData.customer_profile
    const userName = otherUser?.full_name || 'Unknown User'
    const taskTitle = chat.task?.title || 'Untitled Task'
    
    const matchesSearch = searchQuery === '' || 
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      taskTitle.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesUnread = !showUnreadOnly || (chat.unread_count || 0) > 0
    
    // Filter by active status
    const matchesActive = !showActiveOnly || chat.is_active
    
    return matchesSearch && matchesUnread && matchesActive
  })

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

  const renderChatItem = ({ item }: { item: Chat }) => {
    const chatData = chatProfiles[item.id]
    if (!chatData) {
      return (
        <View style={styles.chatItem}>
          <ActivityIndicator size="small" color={Colors.primary[500]} />
        </View>
      )
    }

    const isCustomer = profile?.id === item.customer_id
    const otherUser = isCustomer ? chatData.tasker_profile : chatData.customer_profile
    const userName = otherUser?.full_name || 'Unknown User'
    const userInitial = otherUser?.full_name?.charAt(0)?.toUpperCase() || '?'
    const taskTitle = item.task?.title || 'Untitled Task'
    const taskStatus = item.task?.status || 'unknown'
    const lastMessage = chatData.last_message?.message || 'No messages yet'
    const lastMessageTime = chatData.last_message?.created_at ? formatTime(chatData.last_message.created_at) : ''
    const isActive = item.is_active

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          !isActive && styles.chatItemInactive
        ]}
        onPress={() => onSelectChat({
          ...item,
          customer_profile: chatData.customer_profile,
          tasker_profile: chatData.tasker_profile,
          last_message: chatData.last_message
        })}
        disabled={!isActive}
      >
        <View style={styles.avatarContainer}>
          <View style={[
            styles.avatar,
            !isActive && styles.avatarInactive
          ]}>
            <Text style={[
              styles.avatarText,
              !isActive && styles.avatarTextInactive
            ]}>{userInitial}</Text>
          </View>
          {(item.unread_count || 0) > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {(item.unread_count || 0) > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[
              styles.userName,
              !isActive && styles.userNameInactive
            ]} numberOfLines={1}>
              {userName}
            </Text>
            {lastMessageTime && (
              <Text style={[
                styles.timeText,
                !isActive && styles.timeTextInactive
              ]}>{lastMessageTime}</Text>
            )}
          </View>
          
          <View style={styles.taskInfoRow}>
            <Text style={[
              styles.taskTitle,
              !isActive && styles.taskTitleInactive
            ]} numberOfLines={1}>
              {taskTitle}
            </Text>
            <View style={styles.statusContainer}>
              <Ionicons 
                name={getStatusIcon(taskStatus) as any} 
                size={14} 
                color={getStatusColor(taskStatus)} 
              />
              <Text style={[
                styles.statusText,
                { color: getStatusColor(taskStatus) }
              ]}>
                {taskStatus.replace('_', ' ')}
              </Text>
            </View>
          </View>
          
          <Text style={[
            styles.lastMessage,
            !isActive && styles.lastMessageInactive
          ]} numberOfLines={1}>
            {!isActive ? 'Chat disabled - task completed' : lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={Colors.neutral[300]} />
      <Text style={styles.emptyStateText}>
        {showActiveOnly ? 'No active conversations' : 'No conversations yet'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {showActiveOnly 
          ? 'Chats appear here once tasks are assigned and disappear when completed'
          : 'Start chatting with taskers or customers about your tasks'
        }
      </Text>
    </View>
  )

  if (loading || loadingProfiles) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, showUnreadOnly && styles.filterButtonActive]}
          onPress={() => setShowUnreadOnly(!showUnreadOnly)}
        >
          <Ionicons 
            name="mail-unread" 
            size={20} 
            color={showUnreadOnly ? Colors.primary[500] : Colors.text.secondary} 
          />
          <Text style={[
            styles.filterButtonText,
            showUnreadOnly && styles.filterButtonTextActive
          ]}>
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Only Toggle */}
      <View style={styles.activeToggleContainer}>
        <TouchableOpacity
          style={[styles.activeToggleButton, showActiveOnly && styles.activeToggleButtonActive]}
          onPress={() => setShowActiveOnly(!showActiveOnly)}
        >
          <Ionicons 
            name={showActiveOnly ? "checkmark-circle" : "ellipse-outline"} 
            size={20} 
            color={showActiveOnly ? Colors.primary[500] : Colors.text.secondary} 
          />
          <Text style={[
            styles.activeToggleText,
            showActiveOnly && styles.activeToggleTextActive
          ]}>
            Active chats only
          </Text>
        </TouchableOpacity>
        <Text style={styles.activeToggleSubtext}>
          {showActiveOnly ? 'Showing only active task chats' : 'Showing all chats'}
        </Text>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        style={styles.flatList}
      />
    </View>
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
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.background.primary,
    gap: Spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  filterButtonTextActive: {
    color: Colors.text.inverse,
  },
  listContainer: {
    paddingBottom: Spacing.xl,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  chatItemInactive: {
    opacity: 0.5,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInactive: {
    backgroundColor: Colors.neutral[200],
  },
  avatarText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  avatarTextInactive: {
    color: Colors.text.tertiary,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error[500],
    borderWidth: 2,
    borderColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  userNameInactive: {
    color: Colors.text.tertiary,
  },
  timeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  timeTextInactive: {
    color: Colors.text.secondary,
  },
  taskInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  taskTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  taskTitleInactive: {
    color: Colors.text.tertiary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  lastMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    lineHeight: 18,
  },
  lastMessageInactive: {
    color: Colors.text.secondary,
  },
  unreadCountContainer: {
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  unreadCount: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
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
    paddingVertical: Spacing.xxxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  chatList: {
    paddingBottom: Spacing.xl,
  },
  flatList: {
    flex: 1,
  },
  activeToggleContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  activeToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  activeToggleButtonActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  activeToggleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  activeToggleTextActive: {
    color: Colors.primary[500],
  },
  activeToggleSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
})
