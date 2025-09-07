import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { TaskApplication } from '../hooks/useTasks'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface TaskApplicationCardProps {
  application: TaskApplication
  onAccept: (applicationId: string) => void
  onDecline: (applicationId: string) => void
  onViewProfile: (taskerProfile: TaskApplication['tasker_profile']) => void
  isOwner: boolean
}

export default function TaskApplicationCard({
  application,
  onAccept,
  onDecline,
  onViewProfile,
  isOwner,
}: TaskApplicationCardProps) {
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    Alert.alert(
      'Accept Application',
      `Are you sure you want to accept ${application.tasker_profile?.full_name}'s application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true)
              await onAccept(application.id)
              Alert.alert('Success', 'Application accepted! The tasker will be notified.')
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to accept application')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleDecline = async () => {
    Alert.alert(
      'Decline Application',
      `Are you sure you want to decline ${application.tasker_profile?.full_name}'s application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              await onDecline(application.id)
              Alert.alert('Success', 'Application declined.')
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to decline application')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return Colors.success[500]
      case 'rejected':
        return Colors.error[500]
      default:
        return Colors.warning[500]
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted'
      case 'rejected':
        return 'Declined'
      default:
        return 'Pending'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <View style={styles.container}>
      {/* Header with Tasker Info */}
      <View style={styles.header}>
        <View style={styles.taskerInfo}>
          <Image
            source={{
              uri: application.tasker_profile?.avatar_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            }}
            style={styles.avatar}
          />
          <View style={styles.taskerDetails}>
            <Text style={styles.taskerName}>
              {application.tasker_profile?.full_name || 'Unknown Tasker'}
            </Text>
            <Text style={styles.taskerUsername}>
              @{application.tasker_profile?.username || 'unknown'}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>
                {application.tasker_profile?.rating_average?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.reviewCount}>
                ({application.tasker_profile?.rating_count || 0} reviews)
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
            <Text style={styles.statusText}>{getStatusText(application.status)}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(application.created_at)}</Text>
        </View>
      </View>

      {/* Application Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailLabel}>Proposed Price:</Text>
          <Text style={styles.detailValue}>${application.proposed_price}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailLabel}>Estimated Time:</Text>
          <Text style={styles.detailValue}>{application.estimated_time} hours</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailLabel}>Available Date:</Text>
          <Text style={styles.detailValue}>{formatDate(application.availability_date)}</Text>
        </View>
      </View>

      {/* Message */}
      {application.message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Message:</Text>
          <Text style={styles.messageText}>{application.message}</Text>
        </View>
      )}

      {/* Action Buttons */}
      {isOwner && application.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewProfileButton]}
            onPress={() => onViewProfile(application.tasker_profile)}
            disabled={loading}
          >
            <Ionicons name="person" size={16} color={Colors.primary[500]} />
            <Text style={styles.viewProfileText}>View Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={handleDecline}
            disabled={loading}
          >
            <Ionicons name="close" size={16} color={Colors.error[500]} />
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status-specific actions */}
      {application.status === 'accepted' && (
        <View style={styles.acceptedContainer}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success[500]} />
          <Text style={styles.acceptedText}>Application accepted</Text>
        </View>
      )}

      {application.status === 'rejected' && (
        <View style={styles.rejectedContainer}>
          <Ionicons name="close-circle" size={20} color={Colors.error[500]} />
          <Text style={styles.rejectedText}>Application declined</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  taskerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.md,
  },
  taskerDetails: {
    flex: 1,
  },
  taskerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  taskerUsername: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  reviewCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.inverse,
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  details: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    minWidth: 100,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  messageContainer: {
    marginBottom: Spacing.md,
  },
  messageLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  messageText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  viewProfileButton: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.background.primary,
  },
  viewProfileText: {
    color: Colors.primary[500],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  declineButton: {
    borderColor: Colors.error[500],
    backgroundColor: Colors.background.primary,
  },
  declineText: {
    color: Colors.error[500],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  acceptButton: {
    borderColor: Colors.success[500],
    backgroundColor: Colors.success[500],
  },
  acceptText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  acceptedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.success[50],
    borderRadius: BorderRadius.md,
  },
  acceptedText: {
    color: Colors.success[700],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  rejectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.error[50],
    borderRadius: BorderRadius.md,
  },
  rejectedText: {
    color: Colors.error[700],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
})
