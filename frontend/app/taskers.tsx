import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { useTaskers } from '../hooks/useTaskers'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import BookingModal from '../components/BookingModal'

export default function Taskers() {
  const { profile } = useAuth()
  const { taskers, loading, error, refetch, getTaskersByCategory, getTaskersBySort } = useTaskers()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [selectedTasker, setSelectedTasker] = useState<any>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTechnicianDetails, setShowTechnicianDetails] = useState(false)

  const categories = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'cleaning', label: 'Cleaning', icon: 'water' },
            { id: 'plumbing', label: 'Plumbing', icon: 'hammer' },
    { id: 'electrical', label: 'Electrical', icon: 'flash' },
    { id: 'moving', label: 'Moving', icon: 'car' },
  ]

  const getFilteredTaskers = () => {
    let filtered = getTaskersByCategory(selectedCategory)
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((tasker: any) => 
        tasker.full_name.toLowerCase().includes(query) ||
        tasker.skills.some((skill: string) => skill.toLowerCase().includes(query)) ||
        tasker.city?.toLowerCase().includes(query) ||
        tasker.state?.toLowerCase().includes(query)
      )
    }
    
    return getTaskersBySort(filtered, sortBy)
  }

  const renderCategoryButton = (category: any) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.categoryButtonActive
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Ionicons 
        name={category.icon as any} 
        size={20} 
        color={selectedCategory === category.id ? Colors.text.inverse : Colors.text.secondary} 
      />
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category.id && styles.categoryButtonTextActive
      ]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  )

  const renderTasker = ({ item }: { item: any }) => (
    <View style={styles.taskerCard}>
      <View style={styles.taskerHeader}>
        <Image 
          source={{ uri: item.avatar_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }} 
          style={styles.avatar} 
        />
        <View style={styles.taskerInfo}>
          <Text style={styles.taskerName}>{item.full_name}</Text>
          <Text style={styles.taskerService}>{item.skills[0] || 'General'}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{item.rating_average.toFixed(1)}</Text>
            <Text style={styles.reviews}>({item.rating_count} reviews)</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.hourlyRate}>${item.hourly_rate}/hr</Text>
          <Text style={styles.distance}>{item.city}, {item.state}</Text>
        </View>
      </View>

      <View style={styles.skillsContainer}>
        {item.skills.slice(0, 3).map((skill: string, index: number) => (
          <View key={index} style={styles.skillChip}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.availabilityContainer}>
        <Ionicons name="time" size={16} color="#28a745" />
        <Text style={styles.availability}>
          {item.is_available ? 'Available now' : 'Not available'}
        </Text>
        {item.response_time && (
          <Text style={styles.responseTime}>• Responds in {item.response_time}</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.viewProfileButton}
          onPress={() => {
            setSelectedTasker(item)
            setShowTechnicianDetails(true)
          }}
        >
          <Text style={styles.viewProfileButtonText}>View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bookButton, !item.is_available && styles.bookButtonDisabled]}
          onPress={() => {
            setSelectedTasker(item)
            setShowBookingModal(true)
          }}
          disabled={!item.is_available}
        >
          <Text style={styles.bookButtonText}>
            {item.is_available ? 'Book Now' : 'Not Available'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Taskers</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by skills, location, or name..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading available taskers...</Text>
        </View>
      )}

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={({ item }) => renderCategoryButton(item)}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {[
            { id: 'rating', label: 'Rating' },
            { id: 'experience', label: 'Experience' },
            { id: 'price', label: 'Price' },
            { id: 'completed', label: 'Completed' },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortButton,
                sortBy === option.id && styles.sortButtonActive
              ]}
              onPress={() => setSortBy(option.id)}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === option.id && styles.sortButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={Colors.error[500]} />
          <Text style={styles.errorText}>Error loading taskers: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Taskers List */}
      <FlatList
        data={getFilteredTaskers()}
        renderItem={renderTasker}
        keyExtractor={(item) => item.profile_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.neutral[300]} />
            <Text style={styles.emptyStateText}>
              {loading ? 'Loading taskers...' : 'No taskers available'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {loading ? 'Please wait...' : 'Try adjusting your filters or check back later'}
            </Text>
          </View>
        }
      />

      {/* Technician Details View */}
      {showTechnicianDetails && selectedTasker && (
        <View style={styles.technicianDetailsOverlay}>
          <View style={styles.technicianDetailsContainer}>
            <View style={styles.technicianDetailsHeader}>
              <Image 
                source={{ uri: selectedTasker.avatar_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }} 
                style={styles.technicianDetailsAvatar} 
              />
              <View style={styles.technicianDetailsInfo}>
                <Text style={styles.technicianDetailsName}>{selectedTasker.full_name}</Text>
                <Text style={styles.technicianDetailsUsername}>@{selectedTasker.username}</Text>
                <View style={styles.technicianDetailsRating}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.technicianDetailsRatingText}>
                    {selectedTasker.rating_average.toFixed(1)} ({selectedTasker.rating_count} reviews)
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTechnicianDetails(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.technicianDetailsBio}>{selectedTasker.bio || 'No bio provided'}</Text>
            
            <View style={styles.technicianDetailsStats}>
              <View style={styles.technicianStat}>
                <Text style={styles.technicianStatValue}>{selectedTasker.total_tasks_completed || 0}</Text>
                <Text style={styles.technicianStatLabel}>Jobs Completed</Text>
              </View>
              <View style={styles.technicianStat}>
                <Text style={styles.technicianStatValue}>{selectedTasker.experience_years || 0}</Text>
                <Text style={styles.technicianStatLabel}>Years Experience</Text>
              </View>
              <View style={styles.technicianStat}>
                <Text style={styles.technicianStatValue}>${selectedTasker.hourly_rate || 0}/hr</Text>
                <Text style={styles.technicianStatLabel}>Hourly Rate</Text>
              </View>
            </View>

            <View style={styles.technicianDetailsSkills}>
              <Text style={styles.technicianDetailsSkillsTitle}>Skills</Text>
              <View style={styles.technicianSkillsList}>
                {selectedTasker.skills && selectedTasker.skills.length > 0 ? (
                  selectedTasker.skills.map((skill: string, index: number) => (
                    <View key={index} style={styles.technicianSkillChip}>
                      <Text style={styles.technicianSkillText}>{skill}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.technicianNoSkills}>No skills listed</Text>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.bookNowButton, !selectedTasker.is_available && styles.bookNowButtonDisabled]}
              onPress={() => {
                setShowTechnicianDetails(false)
                setShowBookingModal(true)
              }}
              disabled={!selectedTasker.is_available}
            >
              <Text style={styles.bookNowButtonText}>
                {selectedTasker.is_available ? 'Book Now' : 'Not Available'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Booking Modal */}
      <BookingModal
        visible={showBookingModal}
        tasker={selectedTasker}
        onClose={() => {
          setShowBookingModal(false)
          setSelectedTasker(null)
        }}
        onSuccess={() => {
          // Refresh taskers list after successful booking
          refetch()
        }}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  searchButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  categoriesContainer: {
    paddingVertical: Spacing.md,
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryButton: {
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
  categoryButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  categoryButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  categoryButtonTextActive: {
    color: Colors.text.inverse,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.secondary,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  sortLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginRight: Spacing.md,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sortButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.background.primary,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  sortButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  sortButtonTextActive: {
    color: Colors.text.inverse,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  taskerCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  taskerHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.neutral[200],
    marginRight: Spacing.md,
  },
  taskerInfo: {
    flex: 1,
  },
  taskerName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  taskerService: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rating: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  reviews: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  hourlyRate: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[500],
    marginBottom: Spacing.xs,
  },
  distance: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  skillChip: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  skillText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  availability: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success[500],
    fontWeight: Typography.fontWeight.medium,
  },
  responseTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.error[50],
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    color: Colors.error[700],
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.error[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.secondary,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  viewProfileButton: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  viewProfileButtonText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  bookButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  bookButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  technicianDetailsOverlay: {
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
  technicianDetailsContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    margin: Spacing.lg,
    maxHeight: '80%',
    width: '90%',
  },
  technicianDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  technicianDetailsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.neutral[200],
    marginRight: Spacing.md,
  },
  technicianDetailsInfo: {
    flex: 1,
  },
  technicianDetailsName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  technicianDetailsUsername: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  technicianDetailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  technicianDetailsRatingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  technicianDetailsBio: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  technicianDetailsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  technicianStat: {
    alignItems: 'center',
  },
  technicianStatValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[500],
    marginBottom: Spacing.xs,
  },
  technicianStatLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  technicianDetailsSkills: {
    marginBottom: Spacing.md,
  },
  technicianDetailsSkillsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  technicianSkillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  technicianSkillChip: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  technicianSkillText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  technicianNoSkills: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  bookNowButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  bookNowButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  bookNowButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
})
