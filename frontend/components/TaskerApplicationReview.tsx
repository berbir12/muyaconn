import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface TaskerApplication {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  personal_info: {
    full_name: string
    phone: string
    date_of_birth: string
    nationality: string
    id_number: string
  }
  professional_info: {
    experience: string
    skills: string
    hourly_rate: number
    availability: string
    preferred_categories: string[]
  }
  verification: {
    has_valid_id: boolean
    has_background_check: boolean
    has_insurance: boolean
    has_references: boolean
  }
  additional_info: {
    bio: string
    why_tasker: string
  }
  created_at: string
  updated_at: string
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: string
}

export default function TaskerApplicationReview() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState<TaskerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<TaskerApplication | null>(null)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchApplications()
    }
  }, [profile])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasker_applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error: any) {
      console.error('Error fetching applications:', error)
      Alert.alert('Error', 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchApplications()
    setRefreshing(false)
  }

  const reviewApplication = async (applicationId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('tasker_applications')
        .update({
          status,
          admin_notes: notes,
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // If approved, update user role to 'both'
      if (status === 'approved') {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'both' })
          .eq('id', selectedApplication?.user_id)

        if (roleError) {
          console.error('Error updating user role:', roleError)
          Alert.alert('Warning', 'Application approved but failed to update user role. Please contact support.')
        }
      }

      Alert.alert(
        'Success',
        `Application ${status === 'approved' ? 'approved' : 'rejected'} successfully!`,
        [{ text: 'OK', onPress: () => setSelectedApplication(null) }]
      )

      // Refresh applications
      await fetchApplications()
    } catch (error: any) {
      console.error('Error reviewing application:', error)
      Alert.alert('Error', 'Failed to review application')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning[500]
      case 'approved': return Colors.success[500]
      case 'rejected': return Colors.error[500]
      case 'under_review': return Colors.primary[500]
      default: return Colors.neutral[500]
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time'
      case 'approved': return 'checkmark-circle'
      case 'rejected': return 'close-circle'
      case 'under_review': return 'eye'
      default: return 'help-circle'
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Admin privileges required.</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading applications...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasker Applications</Text>
        <Text style={styles.headerSubtitle}>
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {applications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text" size={48} color={Colors.neutral[400]} />
            <Text style={styles.emptyText}>No applications found</Text>
          </View>
        ) : (
          applications.map((application) => (
            <TouchableOpacity
              key={application.id}
              style={styles.applicationCard}
              onPress={() => setSelectedApplication(application)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.applicantInfo}>
                  <Text style={styles.applicantName}>
                    {application.personal_info.full_name}
                  </Text>
                  <Text style={styles.applicantPhone}>
                    {application.personal_info.phone}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(application.status) }
                ]}>
                  <Ionicons
                    name={getStatusIcon(application.status) as any}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.statusText}>
                    {application.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.skillsText}>
                  Skills: {application.professional_info.skills}
                </Text>
                <Text style={styles.experienceText}>
                  Experience: {application.professional_info.experience}
                </Text>
                <Text style={styles.rateText}>
                  Rate: ETB {application.professional_info.hourly_rate}/hr
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                  Applied: {new Date(application.created_at).toLocaleDateString()}
                </Text>
                {application.reviewed_at && (
                  <Text style={styles.reviewedText}>
                    Reviewed: {new Date(application.reviewed_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Application Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedApplication(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Name:</Text> {selectedApplication.personal_info.full_name}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Phone:</Text> {selectedApplication.personal_info.phone}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Date of Birth:</Text> {selectedApplication.personal_info.date_of_birth}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Nationality:</Text> {selectedApplication.personal_info.nationality}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>ID Number:</Text> {selectedApplication.personal_info.id_number}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Professional Information</Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Experience:</Text> {selectedApplication.professional_info.experience}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Skills:</Text> {selectedApplication.professional_info.skills}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Hourly Rate:</Text> ETB {selectedApplication.professional_info.hourly_rate}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Availability:</Text> {selectedApplication.professional_info.availability}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Categories:</Text> {selectedApplication.professional_info.preferred_categories.join(', ')}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Verification</Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Valid ID:</Text> {selectedApplication.verification.has_valid_id ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Background Check:</Text> {selectedApplication.verification.has_background_check ? 'Agreed' : 'No'}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Insurance:</Text> {selectedApplication.verification.has_insurance ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>References:</Text> {selectedApplication.verification.has_references ? 'Yes' : 'No'}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Bio:</Text> {selectedApplication.additional_info.bio}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Why Tasker:</Text> {selectedApplication.additional_info.why_tasker}
                </Text>
              </View>

              {selectedApplication.admin_notes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Admin Notes</Text>
                  <Text style={styles.detailText}>{selectedApplication.admin_notes}</Text>
                </View>
              )}
            </ScrollView>

            {selectedApplication.status === 'pending' && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => reviewApplication(selectedApplication.id, 'approved')}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => {
                    Alert.prompt(
                      'Reject Application',
                      'Please provide a reason for rejection:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Reject',
                          onPress: (notes) => reviewApplication(selectedApplication.id, 'rejected', notes)
                        }
                      ],
                      'plain-text'
                    )
                  }}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  applicationCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  applicantPhone: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
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
    color: '#fff',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  cardContent: {
    marginBottom: Spacing.md,
  },
  skillsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  experienceText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  rateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  reviewedText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  label: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  approveButton: {
    backgroundColor: Colors.success[500],
  },
  rejectButton: {
    backgroundColor: Colors.error[500],
  },
  actionButtonText: {
    color: '#fff',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.error[500],
    textAlign: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
    padding: Spacing.xl,
  },
})
