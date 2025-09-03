import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import RatingStars from './RatingStars'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import { Review } from '../services/RatingService'

interface ReviewCardProps {
  review: Review
  showTaskInfo?: boolean
  onLike?: (reviewId: string, isHelpful: boolean) => void
  onRespond?: (reviewId: string, responseText: string) => void
  currentUserId?: string
  style?: any
}

export default function ReviewCard({
  review,
  showTaskInfo = false,
  onLike,
  onRespond,
  currentUserId,
  style
}: ReviewCardProps) {
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)

  const handleLike = () => {
    if (onLike) {
      onLike(review.id, true)
    }
  }

  const handleDislike = () => {
    if (onLike) {
      onLike(review.id, false)
    }
  }

  const handleRespond = async () => {
    if (!responseText.trim()) {
      Alert.alert('Response Required', 'Please enter a response before submitting.')
      return
    }

    try {
      setSubmittingResponse(true)
      if (onRespond) {
        await onRespond(review.id, responseText.trim())
        setResponseText('')
        setShowResponseModal(false)
        Alert.alert('Success', 'Your response has been submitted.')
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit response.')
    } finally {
      setSubmittingResponse(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const canRespond = currentUserId === review.reviewee_id && !review.response

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.reviewerInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={20} color={Colors.text.secondary} />
          </View>
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>
              {review.reviewer_profile?.full_name || 'Anonymous'}
            </Text>
            <Text style={styles.reviewDate}>
              {formatDate(review.created_at)}
            </Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <RatingStars rating={review.rating} size={16} />
        </View>
      </View>

      {showTaskInfo && review.task && (
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>Task: {review.task.title}</Text>
        </View>
      )}

      {review.criteria && review.criteria.length > 0 && (
        <View style={styles.criteriaContainer}>
          {review.criteria.map((criterion) => (
            <View key={criterion.id} style={styles.criteriaItem}>
              <Text style={styles.criteriaName}>{criterion.criteria_name}</Text>
              <RatingStars rating={criterion.rating} size={12} />
            </View>
          ))}
        </View>
      )}

      {review.review_text && (
        <View style={styles.reviewTextContainer}>
          <Text style={styles.reviewText}>{review.review_text}</Text>
        </View>
      )}

      {review.response && (
        <View style={styles.responseContainer}>
          <View style={styles.responseHeader}>
            <Text style={styles.responseLabel}>Response from {review.response.responder_profile?.full_name}</Text>
            <Text style={styles.responseDate}>
              {formatDate(review.response.created_at)}
            </Text>
          </View>
          <Text style={styles.responseText}>{review.response.response_text}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.likesContainer}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={handleLike}
            disabled={!onLike}
          >
            <Ionicons 
              name="thumbs-up" 
              size={16} 
              color={review.user_like ? Colors.primary[500] : Colors.text.secondary} 
            />
            <Text style={[
              styles.likeText,
              review.user_like && styles.likeTextActive
            ]}>
              Helpful ({review.likes_count || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {canRespond && (
          <TouchableOpacity
            style={styles.respondButton}
            onPress={() => setShowResponseModal(true)}
          >
            <Text style={styles.respondButtonText}>Respond</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.responseModalContainer}>
          <View style={styles.responseModalHeader}>
            <TouchableOpacity
              onPress={() => setShowResponseModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.responseModalTitle}>Respond to Review</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.responseModalContent}>
            <Text style={styles.responseModalLabel}>
              Respond to {review.reviewer_profile?.full_name}'s review:
            </Text>
            <Text style={styles.responseModalReview}>
              "{review.review_text}"
            </Text>
            
            <Text style={styles.responseInputLabel}>Your Response:</Text>
            <TextInput
              style={styles.responseInput}
              placeholder="Write your response here..."
              value={responseText}
              onChangeText={setResponseText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {responseText.length}/500 characters
            </Text>
          </View>

          <View style={styles.responseModalFooter}>
            <TouchableOpacity
              style={[styles.submitResponseButton, (!responseText.trim() || submittingResponse) && styles.submitResponseButtonDisabled]}
              onPress={handleRespond}
              disabled={!responseText.trim() || submittingResponse}
            >
              <Text style={[styles.submitResponseButtonText, (!responseText.trim() || submittingResponse) && styles.submitResponseButtonTextDisabled]}>
                {submittingResponse ? 'Submitting...' : 'Submit Response'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  taskInfo: {
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  taskTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  criteriaContainer: {
    marginBottom: Spacing.sm,
  },
  criteriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  criteriaName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    flex: 1,
  },
  reviewTextContainer: {
    marginBottom: Spacing.sm,
  },
  reviewText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  responseContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  responseLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  responseDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  responseText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likesContainer: {
    flex: 1,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  likeTextActive: {
    color: Colors.primary,
  },
  respondButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  respondButtonText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  responseModalContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  responseModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  responseModalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  responseModalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  responseModalLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  responseModalReview: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.sm,
  },
  responseInputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  responseModalFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitResponseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitResponseButtonDisabled: {
    backgroundColor: Colors.neutral[200],
  },
  submitResponseButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  submitResponseButtonTextDisabled: {
    color: Colors.text.secondary,
  },
})
