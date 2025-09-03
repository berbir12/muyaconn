import React, { useState, useEffect } from 'react'
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
import ReviewForm from './ReviewForm'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import { useRatings } from '../hooks/useRatings'
import { useAuth } from '../contexts/AuthContext'

interface ReviewPromptProps {
  visible: boolean
  onClose: () => void
  task: {
    id: string
    title: string
    customer_id: string
    tasker_id: string
    status: string
  }
  revieweeProfile: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
  }
  reviewType: 'customer_to_tasker' | 'tasker_to_customer'
}

export default function ReviewPrompt({
  visible,
  onClose,
  task,
  revieweeProfile,
  reviewType
}: ReviewPromptProps) {
  const { user } = useAuth()
  const { createReview, loading, canUserReviewTask } = useRatings()
  const [canReview, setCanReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  useEffect(() => {
    if (visible && task.id) {
      checkReviewEligibility()
    }
  }, [visible, task.id, reviewType])

  const checkReviewEligibility = async () => {
    try {
      setCheckingEligibility(true)
      const eligible = await canUserReviewTask(task.id, reviewType)
      setCanReview(eligible)
    } catch (error) {
      console.error('Error checking review eligibility:', error)
      setCanReview(false)
    } finally {
      setCheckingEligibility(false)
    }
  }

  const handleSubmitReview = async (reviewData: {
    rating: number
    review_text?: string
    criteria?: Array<{ criteria_name: string; rating: number }>
  }) => {
    try {
      await createReview({
        task_id: task.id,
        reviewee_id: revieweeProfile.id,
        rating: reviewData.rating,
        review_text: reviewData.review_text,
        review_type: reviewType,
        criteria: reviewData.criteria
      })

      Alert.alert(
        'Review Submitted! 🎉',
        'Thank you for your feedback. Your review helps improve our community.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowReviewForm(false)
              onClose()
            }
          }
        ]
      )
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review. Please try again.')
    }
  }

  const handleSkip = () => {
    Alert.alert(
      'Skip Review',
      'Are you sure you want to skip leaving a review? You can always leave one later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: onClose
        }
      ]
    )
  }

  const getReviewTypeLabel = () => {
    return reviewType === 'customer_to_tasker' ? 'Tasker' : 'Customer'
  }

  const getPromptTitle = () => {
    return `How was your experience with ${revieweeProfile.full_name}?`
  }

  const getPromptMessage = () => {
    return `Help others by sharing your experience working with this ${getReviewTypeLabel().toLowerCase()}. Your review will be visible to other users.`
  }

  if (showReviewForm) {
    return (
      <ReviewForm
        visible={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        onSubmit={handleSubmitReview}
        reviewType={reviewType}
        revieweeName={revieweeProfile.full_name}
        taskTitle={task.title}
        loading={loading}
      />
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Leave a Review</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {checkingEligibility ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Checking eligibility...</Text>
            </View>
          ) : !canReview ? (
            <View style={styles.notEligibleContainer}>
              <Ionicons name="information-circle" size={48} color={Colors.text.secondary} />
              <Text style={styles.notEligibleTitle}>Cannot Review</Text>
              <Text style={styles.notEligibleText}>
                You cannot review this task. This might be because:
                {'\n\n'}• The task is not completed yet
                {'\n'}• You've already reviewed this task
                {'\n'}• You didn't participate in this task
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>Task: {task.title}</Text>
                <Text style={styles.taskStatus}>Status: {task.status}</Text>
              </View>

              <View style={styles.revieweeInfo}>
                <View style={styles.avatarContainer}>
                  {revieweeProfile.avatar_url ? (
                    <Ionicons name="person" size={24} color={Colors.text.secondary} />
                  ) : (
                    <Ionicons name="person" size={24} color={Colors.text.secondary} />
                  )}
                </View>
                <View style={styles.revieweeDetails}>
                  <Text style={styles.revieweeName}>{revieweeProfile.full_name}</Text>
                  <Text style={styles.revieweeRole}>@{revieweeProfile.username}</Text>
                </View>
              </View>

              <View style={styles.promptSection}>
                <Text style={styles.promptTitle}>{getPromptTitle()}</Text>
                <Text style={styles.promptMessage}>{getPromptMessage()}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => setShowReviewForm(true)}
                >
                  <Ionicons name="star" size={20} color={Colors.text.inverse} />
                  <Text style={styles.reviewButtonText}>Write Review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                >
                  <Text style={styles.skipButtonText}>Skip for Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  notEligibleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  notEligibleTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  notEligibleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  closeButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  taskInfo: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  taskStatus: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  revieweeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  revieweeDetails: {
    flex: 1,
  },
  revieweeName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  revieweeRole: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  promptSection: {
    marginBottom: Spacing.xl,
  },
  promptTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  promptMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    gap: Spacing.md,
  },
  reviewButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  reviewButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipButtonText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
  },
})
