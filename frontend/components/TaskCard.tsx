import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography, Shadows, CommonStyles } from '../constants/Design'

interface TaskCardProps {
  task: {
    id: string
    title: string
    description: string
    budget_min?: number
    budget_max?: number
    task_size: 'small' | 'medium' | 'large'
    status: string
    urgency: 'flexible' | 'within_week' | 'urgent'
    city: string
    state: string
    task_categories?: {
      name: string
      icon: string
      color: string
    }
    applications_count?: number
  }
}

export default function TaskCard({ task }: TaskCardProps) {
  const animatedScale = new Animated.Value(1)

  const handlePressIn = () => {
    Animated.spring(animatedScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  const getStatusColor = (status: string) => {
    return Colors.status[status as keyof typeof Colors.status] || Colors.neutral[400]
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return Colors.error[500]
      case 'within_week': return Colors.warning[500]
      case 'flexible': return Colors.success[500]
      default: return Colors.neutral[400]
    }
  }

  const getSizeIcon = (size: string) => {
    switch (size) {
      case 'small': return 'resize-outline'
      case 'medium': return 'resize'
      case 'large': return 'expand'
      default: return 'resize'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'flash'
      case 'within_week': return 'time'
      case 'flexible': return 'calendar-outline'
      default: return 'time'
    }
  }

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: animatedScale }] }]}>
      <Pressable
        onPress={() => router.push(`/task/${task.id}`)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        {/* Priority Indicator */}
        {task.urgency === 'urgent' && (
          <View style={styles.priorityIndicator}>
            <LinearGradient
              colors={[Colors.error[400], Colors.error[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.priorityGradient}
            >
              <Ionicons name="flash" size={12} color={Colors.text.inverse} />
              <Text style={styles.priorityText}>URGENT</Text>
            </LinearGradient>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                <Text style={styles.badgeText}>{task.status.replace('_', ' ')}</Text>
              </View>
              <View style={styles.urgencyContainer}>
                <Ionicons 
                  name={getUrgencyIcon(task.urgency) as any} 
                  size={12} 
                  color={getUrgencyColor(task.urgency)} 
                />
                <Text style={[styles.urgencyText, { color: getUrgencyColor(task.urgency) }]}>
                  {task.urgency.replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>
          
          {task.budget_min && task.budget_max && (
            <View style={styles.budgetContainer}>
              <Text style={styles.budgetLabel}>Budget</Text>
              <Text style={styles.budget}>
                ${task.budget_min}-${task.budget_max}
              </Text>
            </View>
          )}
        </View>

        {/* Category & Location Row */}
        <View style={styles.infoRow}>
          <View style={styles.categoryContainer}>
            <View style={[
              styles.categoryIcon, 
              { backgroundColor: task.task_categories?.color || Colors.primary[500] }
            ]}>
              <Ionicons 
                name={task.task_categories?.icon as any || 'briefcase'} 
                size={16} 
                color={Colors.text.inverse} 
              />
            </View>
            <Text style={styles.categoryName}>
              {task.task_categories?.name || 'General'}
            </Text>
          </View>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color={Colors.text.secondary} />
            <Text style={styles.location}>{task.city}, {task.state}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.metadataRow}>
            <View style={styles.sizeContainer}>
              <Ionicons 
                name={getSizeIcon(task.task_size) as any} 
                size={14} 
                color={Colors.text.secondary} 
              />
              <Text style={styles.sizeText}>{task.task_size}</Text>
            </View>
            
            {task.applications_count !== undefined && (
              <View style={styles.applicationsContainer}>
                <View style={[
                  styles.applicationsBadge,
                  { backgroundColor: task.applications_count > 0 ? Colors.success[50] : Colors.neutral[100] }
                ]}>
                  <Ionicons 
                    name="people" 
                    size={14} 
                    color={task.applications_count > 0 ? Colors.success[600] : Colors.text.secondary} 
                  />
                  <Text style={[
                    styles.applicationsText,
                    { color: task.applications_count > 0 ? Colors.success[600] : Colors.text.secondary }
                  ]}>
                    {task.applications_count}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={Colors.text.tertiary} 
            style={styles.chevron}
          />
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  priorityIndicator: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
    zIndex: 1,
  },
  priorityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleSection: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    ...CommonStyles.heading3,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
    textTransform: 'capitalize',
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  urgencyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  budgetContainer: {
    alignItems: 'flex-end',
  },
  budgetLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  budget: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success[600],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  categoryName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[600],
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  location: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  description: {
    ...CommonStyles.body2,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  sizeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  applicationsContainer: {
    alignItems: 'center',
  },
  applicationsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  applicationsText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  chevron: {
    opacity: 0.6,
  },
})