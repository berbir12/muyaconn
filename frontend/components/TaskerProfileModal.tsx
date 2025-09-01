import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface TaskerProfile {
  full_name: string
  username: string
  avatar_url?: string
  rating_average: number
  rating_count: number
  hourly_rate?: number
  bio?: string
  skills?: string[]
  experience_years?: number
  response_time?: string
  city?: string
  state?: string
  completed_tasks?: number
  certifications?: string[]
  languages?: string[]
}

interface TaskerProfileModalProps {
  visible: boolean
  onClose: () => void
  taskerProfile: TaskerProfile | undefined
}

export default function TaskerProfileModal({
  visible,
  onClose,
  taskerProfile,
}: TaskerProfileModalProps) {
  if (!taskerProfile) return null

  const renderSkillChip = ({ item }: { item: string }) => (
    <View style={styles.skillChip}>
      <Text style={styles.skillText}>{item}</Text>
    </View>
  )

  const renderCertificationChip = ({ item }: { item: string }) => (
    <View style={styles.certificationChip}>
      <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
      <Text style={styles.certificationText}>{item}</Text>
    </View>
  )

  const renderLanguageChip = ({ item }: { item: string }) => (
    <View style={styles.languageChip}>
      <Ionicons name="language" size={16} color={Colors.primary[500]} />
      <Text style={styles.languageText}>{item}</Text>
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tasker Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <Image
              source={{
                uri: taskerProfile.avatar_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
              }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{taskerProfile.full_name}</Text>
              <Text style={styles.profileUsername}>@{taskerProfile.username}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.rating}>{taskerProfile.rating_average.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({taskerProfile.rating_count} reviews)</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                ${taskerProfile.hourly_rate || 0}
              </Text>
              <Text style={styles.statLabel}>Hourly Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {taskerProfile.completed_tasks || 0}
              </Text>
              <Text style={styles.statLabel}>Tasks Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {taskerProfile.experience_years || 0}
              </Text>
              <Text style={styles.statLabel}>Years Experience</Text>
            </View>
          </View>

          {/* Location */}
          {(taskerProfile.city || taskerProfile.state) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color={Colors.primary[500]} />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              <Text style={styles.locationText}>
                {[taskerProfile.city, taskerProfile.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {/* Bio */}
          {taskerProfile.bio && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={20} color={Colors.primary[500]} />
                <Text style={styles.sectionTitle}>About</Text>
              </View>
              <Text style={styles.bioText}>{taskerProfile.bio}</Text>
            </View>
          )}

          {/* Skills */}
          {taskerProfile.skills && taskerProfile.skills.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="hammer" size={20} color={Colors.primary[500]} />
                <Text style={styles.sectionTitle}>Skills & Expertise</Text>
              </View>
              <FlatList
                data={taskerProfile.skills}
                renderItem={renderSkillChip}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.skillsContainer}
              />
            </View>
          )}

          {/* Certifications */}
          {taskerProfile.certifications && taskerProfile.certifications.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="ribbon" size={20} color={Colors.primary[500]} />
                <Text style={styles.sectionTitle}>Certifications</Text>
              </View>
              <FlatList
                data={taskerProfile.certifications}
                renderItem={renderCertificationChip}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.certificationsContainer}
              />
            </View>
          )}

          {/* Languages */}
          {taskerProfile.languages && taskerProfile.languages.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="chatbubbles" size={20} color={Colors.primary[500]} />
                <Text style={styles.sectionTitle}>Languages</Text>
              </View>
              <FlatList
                data={taskerProfile.languages}
                renderItem={renderLanguageChip}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.languagesContainer}
              />
            </View>
          )}

          {/* Response Time */}
          {taskerProfile.response_time && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={20} color={Colors.primary[500]} />
                <Text style={styles.sectionTitle}>Response Time</Text>
              </View>
              <Text style={styles.responseTimeText}>{taskerProfile.response_time}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="chatbubble" size={20} color={Colors.text.inverse} />
              <Text style={styles.contactButtonText}>Contact Tasker</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
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
    paddingHorizontal: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rating: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  reviewCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[500],
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  locationText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  bioText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  skillsContainer: {
    gap: Spacing.sm,
  },
  skillChip: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  skillText: {
    color: Colors.primary[700],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  certificationsContainer: {
    gap: Spacing.sm,
  },
  certificationChip: {
    backgroundColor: Colors.success[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.success[300],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  certificationText: {
    color: Colors.success[700],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  languagesContainer: {
    gap: Spacing.sm,
  },
  languageChip: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[300],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  languageText: {
    color: Colors.primary[700],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  responseTimeText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  actionButtons: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  contactButton: {
    backgroundColor: Colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  contactButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
})
