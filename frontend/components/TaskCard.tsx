import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface TaskCardProps {
  task: any
  showActions?: boolean
  isOwner?: boolean
  onApplyToTask?: () => void
  onViewApplications?: () => void
  onEditTask?: () => void
  onDeleteTask?: () => void
  hasApplied?: boolean
  onStartChat?: () => void
}

export default function TaskCard({
  task,
  showActions = false,
  isOwner = false,
  onApplyToTask,
  onViewApplications,
  onEditTask,
  onDeleteTask,
  hasApplied = false,
  onStartChat,
}: TaskCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (task.urgency === 'urgent') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    }
  }, [task.urgency, pulseAnim])
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return Colors.error[500]
      case 'within_week':
        return Colors.warning[500]
      case 'flexible':
        return Colors.primary[500]
      default:
        return Colors.neutral[400]
    }
  }

  const getUrgencyBackgroundColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return Colors.error[50]
      case 'within_week':
        return Colors.warning[50]
      case 'flexible':
        return Colors.primary[50]
      default:
        return Colors.neutral[50]
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'flash'
      case 'within_week':
        return 'time'
      case 'flexible':
        return 'calendar'
      default:
        return 'calendar-outline'
    }
  }

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'Urgent'
      case 'within_week':
        return 'This Week'
      case 'flexible':
        return 'Flexible'
      default:
        return urgency
    }
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/task/${task.id}`)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={[styles.urgencyContainer, { backgroundColor: getUrgencyBackgroundColor(task.urgency) }]}>
            <Animated.View style={[
              styles.urgencyBadge,
              { 
                backgroundColor: getUrgencyColor(task.urgency),
                borderWidth: 1,
                borderColor: getUrgencyColor(task.urgency) === Colors.error[500] ? Colors.error[600] : 
                            getUrgencyColor(task.urgency) === Colors.warning[500] ? Colors.warning[600] :
                            getUrgencyColor(task.urgency) === Colors.primary[500] ? Colors.primary[600] : Colors.neutral[500],
                transform: [{ scale: pulseAnim }]
              }
            ]}>
            <Ionicons 
              name={getUrgencyIcon(task.urgency) as any} 
              size={12} 
              color={Colors.text.inverse} 
            />
            <Text style={styles.urgencyText}>
              {getUrgencyLabel(task.urgency)}
            </Text>
          </Animated.View>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Budget</Text>
          <Text style={styles.price}>
            ${task.budget}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {task.description}
      </Text>

      {/* Task Details */}
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>
            {task.city}, {task.state}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="time" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>
            Posted {formatDate(task.created_at)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="construct" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>
            {task.task_size} • {task.category}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {showActions && (
        <View style={styles.actions}>
          {isOwner ? (
            <>
              {/* Edit and Delete buttons for task owners */}
              <View style={styles.ownerActions}>
                {onEditTask ? (
                  <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={onEditTask}
                  >
                    <Ionicons name="create-outline" size={16} color={Colors.primary[500]} />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.disabledActionButton}>
                    <Ionicons name="create-outline" size={16} color={Colors.text.tertiary} />
                    <Text style={styles.disabledActionText}>Edit</Text>
                  </View>
                )}
                
                {onDeleteTask ? (
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={onDeleteTask}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.error[500]} />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.disabledActionButton}>
                    <Ionicons name="trash-outline" size={16} color={Colors.text.tertiary} />
                    <Text style={styles.disabledActionText}>Delete</Text>
                  </View>
                )}
              </View>
              
              {/* Show View Applications button only if task is not assigned */}
              {!task.tasker_id ? (
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={onViewApplications}
                >
                  <Ionicons name="people" size={16} color={Colors.text.inverse} />
                  <Text style={styles.actionButtonText}>View Applications</Text>
                </TouchableOpacity>
              ) : (
                // Show chat button for assigned tasks
                <View style={styles.assignedTaskContainer}>
                  <View style={styles.assignedStatus}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.success[500]} />
                    <Text style={styles.assignedStatusText}>Task Assigned</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.chatButton]} 
                    onPress={onStartChat}
                  >
                    <Ionicons name="chatbubble" size={16} color={Colors.primary[500]} />
                    <Text style={styles.chatButtonText}>Message Tasker</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : hasApplied ? (
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonDisabled]} disabled>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
              <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>Already Applied</Text>
            </TouchableOpacity>
          ) : (
            <>
              {onApplyToTask && (
                <TouchableOpacity style={styles.actionButton} onPress={onApplyToTask}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.text.inverse} />
                  <Text style={styles.actionButtonText}>Apply</Text>
                </TouchableOpacity>
              )}
              
              {onStartChat && (
                <TouchableOpacity style={styles.chatButton} onPress={onStartChat}>
                  <Ionicons name="chatbubble-outline" size={16} color={Colors.primary[500]} />
                  <Text style={styles.chatButtonText}>Chat</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: Colors.shadow.medium,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    marginRight: Spacing.sm,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  urgencyContainer: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    shadowColor: Colors.shadow.medium,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 80,
    justifyContent: 'center',
  },
  urgencyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.inverse,
    textTransform: 'capitalize',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  price: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[500],
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  details: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  actions: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[50],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    gap: Spacing.xs,
  },
  editButtonText: {
    color: Colors.primary[500],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error[50],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error[100],
    gap: Spacing.xs,
  },
  deleteButtonText: {
    color: Colors.error[500],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  disabledActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[50],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    gap: Spacing.xs,
    opacity: 0.6,
  },
  disabledActionText: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionButtonDisabled: {
    backgroundColor: Colors.neutral[100],
    borderColor: Colors.neutral[300],
    opacity: 0.7,
  },
  actionButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  actionButtonTextDisabled: {
    color: Colors.text.tertiary,
  },
  actionButtonAssigned: {
    backgroundColor: Colors.success[50],
    borderColor: Colors.success[200],
    opacity: 0.8,
  },
  actionButtonTextAssigned: {
    color: Colors.success[500],
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[50],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
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
  assignedTaskContainer: {
    gap: Spacing.xs,
  },
  assignedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  assignedStatusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.medium,
  },
})
