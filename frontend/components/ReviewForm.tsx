import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import RatingStars from './RatingStars'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface ReviewFormProps {
  visible: boolean
  onClose: () => void
  onSubmit: (reviewData: {
    rating: number
    review_text?: string
    criteria?: Array<{ criteria_name: string; rating: number }>
  }) => void
  reviewType: 'tasker_to_customer' | 'customer_to_tasker'
  revieweeName: string
  taskTitle: string
  loading?: boolean
}

const REVIEW_CRITERIA = {
  tasker_to_customer: [
    { name: 'Communication', key: 'communication' },
    { name: 'Punctuality', key: 'punctuality' },
    { name: 'Payment', key: 'payment' },
    { name: 'Overall Experience', key: 'overall_experience' }
  ],
  customer_to_tasker: [
    { name: 'Quality of Work', key: 'quality' },
    { name: 'Communication', key: 'communication' },
    { name: 'Punctuality', key: 'punctuality' },
    { name: 'Professionalism', key: 'professionalism' },
    { name: 'Overall Experience', key: 'overall_experience' }
  ]
}

export default function ReviewForm({
  visible,
  onClose,
  onSubmit,
  reviewType,
  revieweeName,
  taskTitle,
  loading = false
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({})

  const criteria = REVIEW_CRITERIA[reviewType]

  const handleCriteriaRating = (criteriaKey: string, criteriaRating: number) => {
    setCriteriaRatings(prev => ({
      ...prev,
      [criteriaKey]: criteriaRating
    }))
  }

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating before submitting your review.')
      return
    }

    const criteria = Object.entries(criteriaRatings).map(([key, value]) => ({
      criteria_name: key,
      rating: value
    }))

    onSubmit({
      rating,
      review_text: reviewText.trim() || undefined,
      criteria: criteria.length > 0 ? criteria : undefined
    })
  }

  const handleClose = () => {
    setRating(0)
    setReviewText('')
    setCriteriaRatings({})
    onClose()
  }

  const getReviewTypeLabel = () => {
    return reviewType === 'tasker_to_customer' ? 'Customer' : 'Tasker'
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Write a Review</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewTypeLabel}>
              Reviewing {getReviewTypeLabel()}
            </Text>
            <Text style={styles.revieweeName}>{revieweeName}</Text>
            <Text style={styles.taskTitle}>Task: {taskTitle}</Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Overall Rating *</Text>
            <View style={styles.ratingContainer}>
              <RatingStars
                rating={rating}
                onRatingChange={setRating}
                interactive
                size={32}
                showRating
              />
            </View>
          </View>

          <View style={styles.criteriaSection}>
            <Text style={styles.sectionTitle}>Detailed Ratings</Text>
            {criteria.map((criterion) => (
              <View key={criterion.key} style={styles.criteriaItem}>
                <Text style={styles.criteriaName}>{criterion.name}</Text>
                <RatingStars
                  rating={criteriaRatings[criterion.key] || 0}
                  onRatingChange={(rating) => handleCriteriaRating(criterion.key, rating)}
                  interactive
                  size={24}
                />
              </View>
            ))}
          </View>

          <View style={styles.textSection}>
            <Text style={styles.sectionTitle}>Written Review (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`Share your experience working with ${revieweeName}...`}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {reviewText.length}/500 characters
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, (!rating || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!rating || loading}
          >
            <Text style={[styles.submitButtonText, (!rating || loading) && styles.submitButtonTextDisabled]}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </Text>
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
    paddingHorizontal: Spacing.md,
  },
  reviewInfo: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  reviewTypeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  revieweeName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  taskTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  ratingSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  criteriaSection: {
    marginBottom: Spacing.lg,
  },
  criteriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  criteriaName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    flex: 1,
  },
  textSection: {
    marginBottom: Spacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
    minHeight: 100,
  },
  characterCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.neutral[200],
  },
  submitButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: Colors.text.secondary,
  },
})
