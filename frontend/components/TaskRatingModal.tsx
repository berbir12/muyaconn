import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { RatingService } from '../services/RatingService'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface TaskRatingModalProps {
  visible: boolean
  task: any
  tasker: any
  onClose: () => void
  onRatingSubmitted: () => void
}

export default function TaskRatingModal({
  visible,
  task,
  tasker,
  onClose,
  onRatingSubmitted
}: TaskRatingModalProps) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating)
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.')
      return
    }

    try {
      setSubmitting(true)
      
      await RatingService.createReview({
        task_id: task.id,
        reviewee_id: tasker.id,
        rating,
        review_text: reviewText.trim() || undefined,
        review_type: 'customer_to_tasker'
      })

      Alert.alert(
        'Thank You!',
        'Your rating and review have been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              onRatingSubmitted()
              onClose()
            }
          }
        ]
      )
    } catch (error: any) {
      console.error('Error submitting rating:', error)
      Alert.alert('Error', 'Failed to submit rating. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setReviewText('')
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Your Experience</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Task Info */}
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>{task?.title}</Text>
            <Text style={styles.taskerName}>
              Completed by {tasker?.full_name || 'Unknown Tasker'}
            </Text>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>How was your experience?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRatingPress(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? '#FFD700' : Colors.text.tertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>
              {rating === 0 ? 'Tap a star to rate' : 
               rating === 1 ? 'Poor' :
               rating === 2 ? 'Fair' :
               rating === 3 ? 'Good' :
               rating === 4 ? 'Very Good' : 'Excellent'}
            </Text>
          </View>

          {/* Review Section */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Write a review (optional)</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience with this tasker..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.text.tertiary}
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {reviewText.length}/500 characters
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (rating === 0 || submitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.text.inverse} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Rating</Text>
            )}
          </TouchableOpacity>
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
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.secondary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  taskInfo: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  taskTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  taskerName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  ratingLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  starButton: {
    padding: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  reviewSection: {
    marginBottom: Spacing.xl,
  },
  reviewLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  submitButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
  },
})
