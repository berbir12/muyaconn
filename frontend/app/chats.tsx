import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { ChatService, Chat } from '../services/ChatService'
import Colors from '../constants/Colors'

export default function Chats() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth')
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  useEffect(() => {
    loadChats()
  }, [user])

  const loadChats = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const fetchedChats = await ChatService.getUserChats(user.id)
      setChats(fetchedChats)
    } catch (error) {
      console.error('Error loading chats:', error)
      Alert.alert('Error', 'Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const searchResults = await ChatService.searchChats(user.id, searchQuery)
      setChats(searchResults)
    } catch (error) {
      console.error('Error searching chats:', error)
      Alert.alert('Error', 'Failed to search chats')
    } finally {
      setLoading(false)
    }
  }

  const filteredChats = chats.filter(chat => 
    searchQuery === '' ||
    chat.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.taskerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {user ? `Chat with your ${user.currentMode === 'customer' ? 'taskers' : 'customers'}` : 'Your conversations'}
          </Text>
        </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color={Colors.neutral[600]} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>5</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chats List */}
      <ScrollView style={styles.chatsList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : (
          filteredChats.map((chat) => (
            <TouchableOpacity key={chat.id} style={styles.chatCard}>
              <View style={styles.chatAvatar}>
                <Ionicons 
                  name={user?.currentMode === 'customer' ? 'briefcase' : 'person'} 
                  size={24} 
                  color={Colors.primary[500]} 
                />
              </View>
              
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatTitle}>
                    {user?.currentMode === 'customer' ? chat.taskerName : chat.customerName}
                  </Text>
                  <Text style={styles.chatTime}>{formatTime(chat.lastMessageTime)}</Text>
                </View>
                
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {chat.taskTitle}
                </Text>
                
                <View style={styles.chatFooter}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.lastMessage || 'No messages yet'}
                  </Text>
                  {chat.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{chat.unreadCount}</Text>
        </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        
        {!loading && filteredChats.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.neutral[300]} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Start a conversation by applying to a task'
              }
            </Text>
      </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral[900],
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.neutral[600],
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.error[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral[900],
    marginLeft: 12,
  },
  chatsList: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.neutral[600],
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[900],
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: Colors.neutral[500],
    marginLeft: 8,
  },
  taskTitle: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginBottom: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral[500],
  },
  unreadBadge: {
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
})
