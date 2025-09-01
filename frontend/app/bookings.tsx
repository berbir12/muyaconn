import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useBookings } from '../hooks/useBookings'
import Colors from '../constants/Colors'

export default function BookingsScreen() {
  const { 
    bookings, 
    loading, 
    error, 
    fetchBookings,
    confirmBooking,
    cancelBooking,
    completeBooking,
    updateBookingStatus,
    assignTasker
  } = useBookings()
  
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'cancelled'>('all')

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBookings()
    setRefreshing(false)
  }

  const getFilteredBookings = () => {
    if (selectedFilter === 'all') return bookings
    return bookings.filter(booking => booking.status === selectedFilter)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.warning[500]
      case 'in_progress': return Colors.primary[500]
      case 'completed': return Colors.success[500]
      case 'cancelled': return Colors.error[500]
      default: return Colors.neutral[400]
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return 'time-outline'
      case 'in_progress': return 'play-circle-outline'
      case 'completed': return 'checkmark-done-circle-outline'
      case 'cancelled': return 'close-circle-outline'
      default: return 'help-circle-outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const handleStatusUpdate = async (bookingId: string, newStatus: string, action: string) => {
    try {
      switch (newStatus) {
        case 'in_progress':
          await confirmBooking(bookingId)
          Alert.alert(
            '✅ Work Started!',
            'Great! The work is now in progress. Here\'s what happens next:\n\n• Keep the customer updated on progress\n• Communicate any delays\n• Share photos if relevant\n• Mark as complete when done',
            [
              {
                text: 'Mark Complete',
                onPress: () => handleStatusUpdate(bookingId, 'completed', 'completed')
              },
              {
                text: 'Got It',
                style: 'default'
              }
            ]
          )
          break
        case 'cancelled':
          await cancelBooking(bookingId)
          Alert.alert('❌ Task Cancelled', `Task has been ${action} successfully.`)
          break
        case 'completed':
          await completeBooking(bookingId)
          Alert.alert(
            '🎉 Work Completed!',
            'Excellent! The work has been completed successfully. Here\'s what happens next:\n\n• The customer will be notified\n• They can leave a review\n• Payment will be processed\n• Your stats will be updated',
            [
              {
                text: 'View Details',
                style: 'default'
              }
            ]
          )
          break
        default:
          return
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update task status')
    }
  }

  const renderFilterButton = (filter: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter as any)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  const renderBookingItem = ({ item }: { item: any }) => {
    const isCustomer = item.customer_id === item.customer_profile?.id
    const otherPerson = isCustomer ? item.tasker_profile : item.customer_profile
    
    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{item.title}</Text>
            <Text style={styles.serviceDescription}>
              {item.description || 'No description provided'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons name={getStatusIcon(item.status) as any} size={16} color={Colors.text.inverse} />
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.detailText}>
              {item.address}, {item.city}, {item.state} {item.zip_code}
            </Text>
          </View>
          
          {item.task_date && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.detailText}>
                {new Date(item.task_date).toLocaleDateString()}
                {item.task_time && ` at ${item.task_time}`}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.detailText}>
              {item.budget 
                ? `$${item.budget}`
                : item.final_price 
                  ? `$${item.final_price}`
                  : 'Price to be determined'
              }
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.detailText}>
              {isCustomer ? 'with' : 'for'} {otherPerson?.full_name || 'Unknown'}
            </Text>
          </View>

          {item.estimated_hours && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.detailText}>
                Estimated: {item.estimated_hours} hours
              </Text>
            </View>
          )}

          {item.applications_count > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.detailText}>
                {item.applications_count} application{item.applications_count !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {item.special_instructions && (
            <View style={styles.detailRow}>
              <Ionicons name="chatbubble-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.detailText}>{item.special_instructions}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {item.status === 'open' && isCustomer && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleStatusUpdate(item.id, 'cancelled', 'cancelled')}
            >
              <Ionicons name="close" size={16} color={Colors.text.inverse} />
              <Text style={styles.actionButtonText}>Cancel Task</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'open' && !isCustomer && item.tasker_id && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleStatusUpdate(item.id, 'in_progress', 'started')}
            >
              <Ionicons name="play" size={16} color={Colors.text.inverse} />
              <Text style={styles.actionButtonText}>Start Work</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'in_progress' && !isCustomer && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => router.push(`/chats?taskId=${item.id}`)}
            >
              <Ionicons name="chatbubble" size={16} color={Colors.text.inverse} />
              <Text style={styles.actionButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleStatusUpdate(item.id, 'completed', 'completed')}
            >
              <Ionicons name="checkmark-done" size={16} color={Colors.text.inverse} />
              <Text style={styles.actionButtonText}>Mark Complete</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'in_progress' && isCustomer && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => router.push(`/chats?taskId=${item.id}`)}
            >
              <Ionicons name="chatbubble" size={16} color={Colors.text.inverse} />
              <Text style={styles.actionButtonText}>Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error[500]} />
          <Text style={styles.errorText}>Error loading tasks</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('open', 'Open')}
        {renderFilterButton('in_progress', 'In Progress')}
        {renderFilterButton('completed', 'Completed')}
        {renderFilterButton('cancelled', 'Cancelled')}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{getFilteredBookings().length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {bookings.filter(b => b.status === 'open').length}
          </Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {bookings.filter(b => b.status === 'in_progress').length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {bookings.filter(b => b.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Tasks List */}
      <FlatList
        data={getFilteredBookings()}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={Colors.neutral[300]} />
            <Text style={styles.emptyText}>No tasks found</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'all' 
                ? 'You haven\'t posted or been assigned any tasks yet'
                : `No ${selectedFilter} tasks found`
              }
            </Text>
          </View>
        }
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.background.primary,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  filterButtonTextActive: {
    color: Colors.text.inverse,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.secondary,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary[500],
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  bookingCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.inverse,
    textTransform: 'capitalize',
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: Colors.primary[500],
  },
  cancelButton: {
    backgroundColor: Colors.error[500],
  },
  startButton: {
    backgroundColor: Colors.primary[500],
  },
  completeButton: {
    backgroundColor: Colors.success[600],
  },
  chatButton: {
    backgroundColor: Colors.primary[500],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error[500],
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[500],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.neutral[400],
    textAlign: 'center',
    lineHeight: 20,
  },
})
