import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface WorkProgressCardProps {
  type: 'task' | 'booking'
  title: string
  status: string
  otherPartyName: string
  startDate: string
  estimatedDuration?: number
  onUpdateStatus?: (newStatus: string) => void
  onChat?: () => void
  onViewDetails?: () => void
}

export default function WorkProgressCard({
  type,
  title,
  status,
  otherPartyName,
  startDate,
  estimatedDuration,
  onUpdateStatus,
  onChat,
  onViewDetails
}: WorkProgressCardProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'in_progress':
        return {
          icon: 'play-circle',
          color: Colors.primary[500],
          label: 'In Progress',
          description: 'Work is currently being done'
        }
      case 'confirmed':
        return {
          icon: 'checkmark-circle',
          color: Colors.success[500],
          label: 'Confirmed',
          description: 'Ready to start work'
        }
      case 'completed':
        return {
          icon: 'checkmark-done-circle',
          color: Colors.success[600],
          label: 'Completed',
          description: 'Work finished successfully'
        }
      default:
        return {
          icon: 'time',
          color: Colors.neutral[400],
          label: status,
          description: 'Status unknown'
        }
    }
  }

  const getNextSteps = () => {
    switch (status) {
      case 'confirmed':
        return [
          'Contact the other party to confirm details',
          'Agree on start time and location',
          'Begin work when ready'
        ]
      case 'in_progress':
        return [
          'Keep the other party updated on progress',
          'Communicate any delays or issues',
          'Mark as complete when finished'
        ]
      case 'completed':
        return [
          'Leave a review for the other party',
          'Process any remaining payments',
          'Archive this work item'
        ]
      default:
        return ['Contact the other party for updates']
    }
  }

  const statusInfo = getStatusInfo()
  const nextSteps = getNextSteps()

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.typeLabel}>
            {type === 'task' ? '📋 Task' : '📅 Direct Booking'}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <Ionicons name={statusInfo.icon as any} size={16} color={Colors.text.inverse} />
          <Text style={styles.statusText}>{statusInfo.label}</Text>
        </View>
      </View>

      {/* Status Description */}
      <Text style={styles.statusDescription}>{statusInfo.description}</Text>

      {/* Work Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>
            Working with: <Text style={styles.highlightText}>{otherPartyName}</Text>
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>
            Started: <Text style={styles.highlightText}>
              {new Date(startDate).toLocaleDateString()}
            </Text>
          </Text>
        </View>

        {estimatedDuration && (
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={Colors.text.secondary} />
            <Text style={styles.detailText}>
              Estimated: <Text style={styles.highlightText}>{estimatedDuration} hours</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Next Steps */}
      <View style={styles.nextStepsContainer}>
        <Text style={styles.nextStepsTitle}>Next Steps:</Text>
        {nextSteps.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <View style={[styles.stepBullet, { backgroundColor: statusInfo.color }]} />
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {onChat && (
          <TouchableOpacity style={styles.chatButton} onPress={onChat}>
            <Ionicons name="chatbubble" size={16} color={Colors.primary[500]} />
            <Text style={styles.chatButtonText}>Message</Text>
          </TouchableOpacity>
        )}
        
        {onUpdateStatus && status === 'confirmed' && (
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={() => onUpdateStatus('in_progress')}
          >
            <Ionicons name="play" size={16} color={Colors.text.inverse} />
            <Text style={styles.startButtonText}>Start Work</Text>
          </TouchableOpacity>
        )}
        
        {onUpdateStatus && status === 'in_progress' && (
          <TouchableOpacity 
            style={styles.completeButton} 
            onPress={() => onUpdateStatus('completed')}
          >
            <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
        
        {onViewDetails && (
          <TouchableOpacity style={styles.detailsButton} onPress={onViewDetails}>
            <Ionicons name="information-circle" size={16} color={Colors.text.secondary} />
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  typeLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.inverse,
  },
  statusDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  detailsContainer: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  highlightText: {
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  nextStepsContainer: {
    marginBottom: Spacing.lg,
  },
  nextStepsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  stepBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    gap: Spacing.xs,
  },
  chatButtonText: {
    color: Colors.primary[600],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  startButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success[600],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  completeButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  detailsButtonText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
})
