import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { RatingService } from '../services/RatingService'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import TaskRatingModal from './TaskRatingModal'
import PaymentModal from './PaymentModal'

interface CompletedTaskCardProps {
  task: any
  onRatingSubmitted: () => void
  customer?: {
    email: string
    full_name: string
    phone?: string
  }
}

export default function CompletedTaskCard({
  task,
  onRatingSubmitted,
  customer
}: CompletedTaskCardProps) {
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [hasRated, setHasRated] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(task.payment_status || 'pending')

  const tasker = task.tasker_profile
  const category = task.task_categories

  const handleRateTask = () => {
    if (!tasker) {
      Alert.alert('Error', 'Tasker information not available.')
      return
    }
    setShowRatingModal(true)
  }

  const handleRatingSubmitted = async () => {
    setHasRated(true)
    onRatingSubmitted()
  }

  const handlePaymentSuccess = () => {
    setPaymentStatus('completed')
    // Show success message
    Alert.alert(
      'Payment Successful',
      'Your payment has been processed successfully. You can now rate the tasker.',
      [{ text: 'OK' }]
    )
  }

  const getPaymentButtonText = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Payment Completed'
      case 'failed':
        return 'Retry Payment'
      default:
        return 'Pay Now'
    }
  }

  const getPaymentButtonColor = () => {
    switch (paymentStatus) {
      case 'completed':
        return Colors.success[500]
      case 'failed':
        return Colors.error[500]
      default:
        return Colors.primary[500]
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success[500]
      default: return Colors.text.secondary
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle'
      default: return 'help-circle'
    }
  }

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {task.title || 'Untitled Task'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Ionicons 
                name={getStatusIcon(task.status)} 
                size={12} 
                color={Colors.text.inverse} 
              />
              <Text style={styles.statusText}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Task Details */}
        <View style={styles.details}>
          {category && (
            <View style={styles.detailRow}>
              <Ionicons name="folder" size={14} color={Colors.text.secondary} />
              <Text style={styles.detailText}>{category.name}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={14} color={Colors.text.secondary} />
            <Text style={styles.detailText}>ETB {task.budget || 0}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={14} color={Colors.text.secondary} />
            <Text style={styles.detailText}>
              Completed {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'Unknown date'}
            </Text>
          </View>
        </View>

        {/* Tasker Info */}
        {tasker && (
          <View style={styles.taskerInfo}>
            <View style={styles.taskerDetails}>
              <Text style={styles.taskerName}>
                Completed by {tasker.full_name || 'Unknown Tasker'}
              </Text>
              {tasker.rating_average && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {tasker.rating_average.toFixed(1)}
                  </Text>
                  <Text style={styles.ratingCount}>
                    ({tasker.rating_count || 0})
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Payment Section */}
        {paymentStatus !== 'completed' && (
          <View style={styles.paymentSection}>
            <TouchableOpacity
              style={[styles.paymentButton, { backgroundColor: getPaymentButtonColor() }]}
              onPress={() => setShowPaymentModal(true)}
            >
              <Ionicons name="card" size={16} color={Colors.text.inverse} />
              <Text style={styles.paymentButtonText}>{getPaymentButtonText()}</Text>
            </TouchableOpacity>
            <Text style={styles.paymentNote}>
              Complete payment to release funds to the tasker
            </Text>
          </View>
        )}

        {/* Rating Section - Only show after payment is completed */}
        {paymentStatus === 'completed' && (
          <View style={styles.ratingSection}>
            {!hasRated ? (
              <TouchableOpacity
                style={styles.rateButton}
                onPress={handleRateTask}
              >
                <Ionicons name="star" size={16} color={Colors.text.inverse} />
                <Text style={styles.rateButtonText}>Rate This Task</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.ratedContainer}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
                <Text style={styles.ratedText}>Thank you for your rating!</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Payment Modal */}
      {customer && (
        <PaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
          task={task}
          customer={customer}
        />
      )}

      {/* Rating Modal */}
      <TaskRatingModal
        visible={showRatingModal}
        task={task}
        tasker={tasker}
        onClose={() => setShowRatingModal(false)}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
  },
  details: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  taskerInfo: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
  },
  taskerDetails: {
    gap: Spacing.xs,
  },
  taskerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  ratingCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  ratingSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.sm,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  rateButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
  },
  ratedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  ratedText: {
    fontSize: Typography.fontSize.md,
    color: Colors.success[500],
    fontWeight: Typography.fontWeight.medium,
  },
  paymentSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.sm,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  paymentButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
  },
  paymentNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
})
