import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import RatingStars from './RatingStars'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import { ReviewStats } from '../services/RatingService'

interface RatingDisplayProps {
  stats: ReviewStats
  showDetails?: boolean
  onViewReviews?: () => void
  style?: any
}

export default function RatingDisplay({
  stats,
  showDetails = false,
  onViewReviews,
  style
}: RatingDisplayProps) {
  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Excellent'
    if (rating >= 4.0) return 'Very Good'
    if (rating >= 3.5) return 'Good'
    if (rating >= 3.0) return 'Average'
    if (rating >= 2.0) return 'Below Average'
    return 'Poor'
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#059669' // Green
    if (rating >= 4.0) return '#10b981' // Light Green
    if (rating >= 3.5) return '#f59e0b' // Yellow
    if (rating >= 3.0) return '#f97316' // Orange
    return '#ef4444' // Red
  }

  const totalReviews = stats.total_reviews
  const averageRating = stats.average_rating
  const ratingText = getRatingText(averageRating)
  const ratingColor = getRatingColor(averageRating)

  if (totalReviews === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.noReviewsContainer}>
          <Ionicons name="star-outline" size={24} color={Colors.text.secondary} />
          <Text style={styles.noReviewsText}>No reviews yet</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.ratingHeader}>
        <View style={styles.ratingInfo}>
          <View style={styles.ratingNumberContainer}>
            <Text style={[styles.ratingNumber, { color: ratingColor }]}>
              {averageRating.toFixed(1)}
            </Text>
            <Text style={styles.ratingText}>{ratingText}</Text>
          </View>
          <View style={styles.starsContainer}>
            <RatingStars rating={averageRating} size={20} />
            <Text style={styles.reviewCount}>
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        
        {onViewReviews && (
          <TouchableOpacity style={styles.viewReviewsButton} onPress={onViewReviews}>
            <Text style={styles.viewReviewsText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {showDetails && (
        <View style={styles.ratingBreakdown}>
          <Text style={styles.breakdownTitle}>Rating Breakdown</Text>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.rating_distribution[`${star}_star` as keyof typeof stats.rating_distribution]
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
            
            return (
              <View key={star} style={styles.ratingBar}>
                <Text style={styles.starLabel}>{star}★</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${percentage}%` }
                      ]} 
                    />
                  </View>
                </View>
                <Text style={styles.countLabel}>{count}</Text>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noReviewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  noReviewsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratingInfo: {
    flex: 1,
  },
  ratingNumberContainer: {
    marginBottom: Spacing.sm,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  starsContainer: {
    alignItems: 'flex-start',
  },
  reviewCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  viewReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewReviewsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  ratingBreakdown: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  breakdownTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  starLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    width: 30,
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  countLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    width: 30,
    textAlign: 'right',
  },
})
