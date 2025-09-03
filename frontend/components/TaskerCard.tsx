import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import RatingStars from './RatingStars'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import { Tasker } from '../services/TaskerService'

interface TaskerCardProps {
  tasker: Tasker
  onPress?: () => void
  showContactButton?: boolean
  onContact?: () => void
  style?: any
}

export default function TaskerCard({
  tasker,
  onPress,
  showContactButton = true,
  onContact,
  style
}: TaskerCardProps) {
  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return Colors.success[500]
      case 'busy': return Colors.warning[500]
      case 'offline': return Colors.text.secondary
      default: return Colors.text.secondary
    }
  }

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available': return 'Available'
      case 'busy': return 'Busy'
      case 'offline': return 'Offline'
      default: return 'Unknown'
    }
  }

  const formatEarnings = (earnings: number) => {
    if (earnings >= 1000) {
      return `$${(earnings / 1000).toFixed(1)}k`
    }
    return `$${earnings.toFixed(0)}`
  }

  const getVerificationBadges = () => {
    const badges = []
    
    if (tasker.identity_verified) {
      badges.push({ icon: 'checkmark-circle', color: Colors.success[500], label: 'ID Verified' })
    }
    
    if (tasker.background_check_verified) {
      badges.push({ icon: 'shield-checkmark', color: Colors.success[500], label: 'Background Check' })
    }
    
    if (tasker.insurance_verified) {
      badges.push({ icon: 'umbrella', color: Colors.primary[500], label: 'Insured' })
    }
    
    if (tasker.references_verified) {
      badges.push({ icon: 'people', color: Colors.primary[500], label: 'References' })
    }
    
    return badges
  }

  const verificationBadges = getVerificationBadges()

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {tasker.user_profile?.avatar_url ? (
              <Image 
                source={{ uri: tasker.user_profile.avatar_url }} 
                style={styles.avatar}
                key={`tasker-avatar-${tasker.user_id}`}
              />
            ) : (
              <Ionicons name="person" size={24} color={Colors.text.secondary} />
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{tasker.user_profile?.full_name}</Text>
            <Text style={styles.username}>@{tasker.user_profile?.username}</Text>
            <View style={styles.ratingContainer}>
              <RatingStars rating={tasker.average_rating} size={14} />
              <Text style={styles.ratingText}>
                {tasker.average_rating.toFixed(1)} ({tasker.total_reviews} reviews)
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getAvailabilityColor(tasker.availability_status) }]}>
            <Text style={styles.statusText}>{getAvailabilityText(tasker.availability_status)}</Text>
          </View>
        </View>
      </View>

      {tasker.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {tasker.bio}
        </Text>
      )}

      {tasker.primary_skills && tasker.primary_skills.length > 0 && (
        <View style={styles.skillsContainer}>
          {tasker.primary_skills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {tasker.primary_skills.length > 3 && (
            <View style={styles.skillTag}>
              <Text style={styles.skillText}>+{tasker.primary_skills.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{tasker.total_tasks_completed}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{tasker.completion_rate.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatEarnings(tasker.total_earnings)}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>${tasker.hourly_rate}/hr</Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
      </View>

      {verificationBadges.length > 0 && (
        <View style={styles.verificationContainer}>
          {verificationBadges.map((badge, index) => (
            <View key={index} style={styles.verificationBadge}>
              <Ionicons name={badge.icon as any} size={12} color={badge.color} />
              <Text style={styles.verificationText}>{badge.label}</Text>
            </View>
          ))}
        </View>
      )}

      {showContactButton && onContact && (
        <TouchableOpacity style={styles.contactButton} onPress={onContact}>
          <Ionicons name="chatbubble" size={16} color={Colors.text.inverse} />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  profileSection: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  username: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  bio: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  skillTag: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  skillText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary[600],
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  verificationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  verificationText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.primary,
    marginLeft: 4,
  },
  contactButton: {
    backgroundColor: Colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  contactButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
})
