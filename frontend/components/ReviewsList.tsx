import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ReviewCard from './ReviewCard'
import RatingDisplay from './RatingDisplay'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import { useUserReviews, useUserReviewStats } from '../hooks/useRatings'
import { useAuth } from '../contexts/AuthContext'

interface ReviewsListProps {
  userId: string
  showStats?: boolean
  limit?: number
  style?: any
}

export default function ReviewsList({
  userId,
  showStats = true,
  limit = 10,
  style
}: ReviewsListProps) {
  const { user } = useAuth()
  const { 
    reviews, 
    loading, 
    error, 
    hasMore, 
    refreshReviews, 
    loadMoreReviews 
  } = useUserReviews(userId, limit)
  
  const { stats, loading: statsLoading } = useUserReviewStats(userId)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshReviews()
    setRefreshing(false)
  }

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMoreReviews()
    }
  }

  const handleLike = async (reviewId: string, isHelpful: boolean) => {
    // This would be implemented with the rating service
    console.log('Like review:', reviewId, isHelpful)
  }

  const handleRespond = async (reviewId: string, responseText: string) => {
    // This would be implemented with the rating service
    console.log('Respond to review:', reviewId, responseText)
  }

  const renderReview = ({ item }: { item: any }) => (
    <ReviewCard
      review={item}
      onLike={handleLike}
      onRespond={handleRespond}
      currentUserId={user?.id}
    />
  )

  const renderFooter = () => {
    if (!loading || !hasMore) return null
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerText}>Loading more reviews...</Text>
      </View>
    )
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={48} color={Colors.text.secondary} />
      <Text style={styles.emptyTitle}>No Reviews Yet</Text>
      <Text style={styles.emptyText}>
        This user hasn't received any reviews yet.
      </Text>
    </View>
  )

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color={Colors.error} />
      <Text style={styles.errorTitle}>Error Loading Reviews</Text>
      <Text style={styles.errorText}>
        {error || 'Something went wrong while loading reviews.'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={refreshReviews}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  )

  if (error && reviews.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {renderError()}
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      {showStats && stats && (
        <RatingDisplay
          stats={stats}
          onViewReviews={() => {
            // Scroll to reviews or show all reviews
            console.log('View all reviews')
          }}
          style={styles.statsContainer}
        />
      )}

      <View style={styles.reviewsHeader}>
        <Text style={styles.reviewsTitle}>
          Reviews ({stats?.total_reviews || 0})
        </Text>
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    marginBottom: Spacing.lg,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reviewsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
})
