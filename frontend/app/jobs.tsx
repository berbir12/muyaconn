import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { TaskService, Task } from '../services/TaskService'
import Colors from '../constants/Colors'

const { width } = Dimensions.get('window')

const categories = ['All', 'Cleaning', 'Handyman', 'Delivery', 'Photography', 'Technology', 'Gardening']

export default function Jobs() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeTab, setActiveTab] = useState('available')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth')
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  useEffect(() => {
    loadTasks()
  }, [activeTab, user])

  const loadTasks = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      let fetchedTasks: Task[] = []
      
      if (activeTab === 'available') {
        fetchedTasks = await TaskService.getAvailableTasks(user.id)
      } else {
        fetchedTasks = await TaskService.getMyTasks(user.id)
      }
      
      setTasks(fetchedTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      Alert.alert('Error', 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyToTask = async (taskId: string) => {
    if (!user) return
    
    try {
      const success = await TaskService.applyToTask(taskId, user.id, 50, 'I would like to apply for this task', new Date().toISOString())
      if (success) {
        Alert.alert('Success', 'Application submitted successfully!')
        loadTasks()
      } else {
        Alert.alert('Error', 'You have already applied to this task')
      }
    } catch (error) {
      console.error('Error applying to task:', error)
      Alert.alert('Error', 'Failed to apply to task')
    }
  }

  const handleSearch = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const searchResults = await TaskService.searchTasks(searchQuery, selectedCategory)
      setTasks(searchResults)
    } catch (error) {
      console.error('Error searching tasks:', error)
      Alert.alert('Error', 'Failed to search tasks')
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || task.category_name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning[500]
      case 'assigned': return Colors.primary[500]
      case 'in_progress': return Colors.primary[500]
      case 'completed': return Colors.success[500]
      case 'cancelled': return Colors.error[500]
      default: return Colors.neutral[500]
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'assigned': return 'Assigned'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return 'Unknown'
    }
  }

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
          <Text style={styles.headerTitle}>
              {activeTab === 'available' ? 'Available Tasks' : 'My Tasks'}
          </Text>
            <Text style={styles.headerSubtitle}>
              {user ? `Hi ${user.name.split(' ')[0]}!` : 'Find your next job'}
          </Text>
        </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.createTaskButton}
              onPress={() => router.push('/post-task')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createTaskText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={22} color={Colors.neutral[600]} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>2</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={Colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
            </View>
        </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
          <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available
          </Text>
          </TouchableOpacity>
          <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Tasks
            </Text>
          </TouchableOpacity>
      </View>

      {/* Category Filters */}
      {activeTab === 'available' && (
        <View style={styles.filtersSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {categories.map((category) => (
          <TouchableOpacity
                key={category}
            style={[
                  styles.filterChip,
                  selectedCategory === category && styles.filterChipActive
            ]}
                onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.filterChipTextActive
            ]}>
                  {category}
            </Text>
          </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tasks List */}
      <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              {/* Task Header */}
              <View style={styles.taskHeader}>
                <View style={styles.taskTitleRow}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.is_urgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>URGENT</Text>
        </View>
      )}
                </View>
                <Text style={styles.taskPrice}>${task.budget}</Text>
              </View>
              
              {/* Task Description */}
              <Text style={styles.taskDescription} numberOfLines={2}>
                {task.description}
            </Text>
              
              {/* Task Meta */}
              <View style={styles.taskMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color={Colors.neutral[500]} />
                  <Text style={styles.metaText}>{task.address}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={Colors.neutral[500]} />
                  <Text style={styles.metaText}>{formatTime(task.created_at)}</Text>
                </View>
                {activeTab === 'available' && (
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={16} color={Colors.neutral[500]} />
                    <Text style={styles.metaText}>{task.customer_name}</Text>
                  </View>
                )}
            </View>
            
              {/* Task Footer */}
              <View style={styles.taskFooter}>
                <View style={styles.taskTags}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{task.category_name}</Text>
              </View>
                  {activeTab === 'available' && (
                    <View style={styles.ratingTag}>
                      <Ionicons name="star" size={14} color={Colors.warning[500]} />
                      <Text style={styles.ratingText}>{task.customer_rating || 5.0}</Text>
                    </View>
                  )}
                  {activeTab === 'my' && (
                    <View style={[styles.statusTag, { backgroundColor: getStatusColor(task.status) + '15' }]}>
                      <Text style={[styles.statusTagText, { color: getStatusColor(task.status) }]}>
                        {getStatusLabel(task.status)}
                </Text>
              </View>
            )}
          </View>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => activeTab === 'available' ? handleApplyToTask(task.id) : null}
                >
                  <Text style={styles.actionButtonText}>
                    {activeTab === 'available' ? 'Apply' : 'View'}
                  </Text>
                </TouchableOpacity>
        </View>
            </View>
          ))
        )}
        
        {!loading && filteredTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color={Colors.neutral[300]} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'available' ? 'No tasks found' : 'No tasks posted'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'available' 
                ? 'Try adjusting your search or filters' 
                : 'Post your first task to get started'
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
    marginBottom: 20,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  createTaskText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  filterButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: Colors.primary[500],
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[600],
  },
  activeTabText: {
    color: '#fff',
  },
  filtersSection: {
    paddingVertical: 16,
    backgroundColor: Colors.background.primary,
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.neutral[600],
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 20,
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
  taskCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[900],
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: Colors.error[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  urgentText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  taskPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success[500],
  },
  taskDescription: {
    fontSize: 15,
    color: Colors.neutral[600],
    marginBottom: 16,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: Colors.neutral[500],
    marginLeft: 6,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTags: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 12,
    color: Colors.primary[600],
    fontWeight: '600',
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.warning[700],
    marginLeft: 4,
    fontWeight: '600',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 40,
  },
})