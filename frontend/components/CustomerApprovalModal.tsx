import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Image,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface CustomerApprovalModalProps {
  visible: boolean
  onClose: () => void
  workItem: {
    id: string
    type: 'task' | 'booking'
    title: string
    status: string
    otherPartyName: string
    startDate: string
    estimatedDuration?: number
    data: any
  }
  workflowData: {
    progressPhotos: string[]
    issues: string[]
    completionNotes: string
    workflowSteps: any[]
  }
  onApprove: (approvalData: any) => void
  onRequestChanges: (changeRequest: any) => void
}

export default function CustomerApprovalModal({
  visible,
  onClose,
  workItem,
  workflowData,
  onApprove,
  onRequestChanges
}: CustomerApprovalModalProps) {
  const [selectedTab, setSelectedTab] = useState<'progress' | 'approval' | 'feedback'>('progress')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [changeRequest, setChangeRequest] = useState('')
  const [rating, setRating] = useState(0)

  const handleApprove = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating before approving.')
      return
    }

    const approvalData = {
      workId: workItem.id,
      approved: true,
      rating,
      notes: approvalNotes,
      approvedAt: new Date().toISOString(),
      workflowData
    }

    onApprove(approvalData)
  }

  const handleRequestChanges = () => {
    if (!changeRequest.trim()) {
      Alert.alert('Change Request Required', 'Please describe what changes you need.')
      return
    }

    const changeRequestData = {
      workId: workItem.id,
      changeRequest: changeRequest.trim(),
      requestedAt: new Date().toISOString(),
      workflowData
    }

    onRequestChanges(changeRequestData)
  }

  const renderProgressTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Progress</Text>
        <Text style={styles.sectionDescription}>
          Review the progress made on your {workItem.type === 'task' ? 'task' : 'booking'}:
        </Text>
      </View>

      {/* Progress Photos */}
      {workflowData.progressPhotos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {workflowData.progressPhotos.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} style={styles.progressPhoto} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Workflow Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workflow Steps</Text>
        {workflowData.workflowSteps.map((step, index) => (
          <View key={step.id} style={styles.workflowStep}>
            <View style={[
              styles.stepIndicator,
              { backgroundColor: step.status === 'completed' ? Colors.success[500] : Colors.neutral[300] }
            ]}>
              {step.status === 'completed' ? (
                <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
              ) : (
                <Text style={styles.stepNumber}>{index + 1}</Text>
              )}
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepStatus}>
                Status: {step.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Issues */}
      {workflowData.issues.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issues Reported</Text>
          {workflowData.issues.map((issue, index) => (
            <View key={index} style={styles.issueItem}>
              <Ionicons name="warning" size={16} color={Colors.warning[500]} />
              <Text style={styles.issueText}>{issue}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Completion Notes */}
      {workflowData.completionNotes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completion Notes</Text>
          <Text style={styles.completionNotes}>{workflowData.completionNotes}</Text>
        </View>
      )}
    </ScrollView>
  )

  const renderApprovalTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Approval</Text>
        <Text style={styles.sectionDescription}>
          Review the completed work and provide your approval:
        </Text>
      </View>

      {/* Quality Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality Checklist</Text>
        <View style={styles.checklist}>
          <View style={styles.checklistItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success[500]} />
            <Text style={styles.checklistText}>Work meets your requirements</Text>
          </View>
          <View style={styles.checklistItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success[500]} />
            <Text style={styles.checklistText}>Quality meets your standards</Text>
          </View>
          <View style={styles.checklistItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success[500]} />
            <Text style={styles.checklistText}>Site is clean and organized</Text>
          </View>
          <View style={styles.checklistItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success[500]} />
            <Text style={styles.checklistText}>Communication was professional</Text>
          </View>
        </View>
      </View>

      {/* Rating */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rate Your Experience</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={32}
                color={star <= rating ? Colors.warning[500] : Colors.neutral[300]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating === 0 ? 'Select a rating' : `${rating} out of 5 stars`}
        </Text>
      </View>

      {/* Approval Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Share your experience or any additional feedback..."
          value={approvalNotes}
          onChangeText={setApprovalNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Approval Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.text.inverse} />
          <Text style={styles.approveButtonText}>Approve & Complete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  const renderFeedbackTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Changes</Text>
        <Text style={styles.sectionDescription}>
          If you need changes or have concerns, describe them below:
        </Text>
      </View>

      {/* Change Request */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What needs to be changed?</Text>
        <TextInput
          style={styles.changeRequestInput}
          placeholder="Describe the changes you need, specific issues, or areas of concern..."
          value={changeRequest}
          onChangeText={setChangeRequest}
          multiline
          numberOfLines={6}
        />
      </View>

      {/* Change Request Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.requestChangesButton} onPress={handleRequestChanges}>
          <Ionicons name="refresh-circle" size={20} color={Colors.text.inverse} />
          <Text style={styles.requestChangesButtonText}>Request Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Help Text */}
      <View style={styles.section}>
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle" size={20} color={Colors.primary[500]} />
          <Text style={styles.helpText}>
            Your request will be sent to the worker. They will review and respond with a plan to address your concerns.
          </Text>
        </View>
      </View>
    </ScrollView>
  )

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Work Review & Approval</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Work Item Info */}
        <View style={styles.workInfo}>
          <Text style={styles.workTitle}>{workItem.title}</Text>
          <Text style={styles.workSubtitle}>
            Completed by {workItem.otherPartyName}
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'progress' && styles.activeTab]}
            onPress={() => setSelectedTab('progress')}
          >
            <Ionicons 
              name="eye" 
              size={16} 
              color={selectedTab === 'progress' ? Colors.primary[500] : Colors.text.secondary} 
            />
            <Text style={[styles.tabText, selectedTab === 'progress' && styles.activeTabText]}>
              Progress
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'approval' && styles.activeTab]}
            onPress={() => setSelectedTab('approval')}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={selectedTab === 'approval' ? Colors.primary[500] : Colors.text.secondary} 
            />
            <Text style={[styles.tabText, selectedTab === 'approval' && styles.activeTabText]}>
              Approve
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'feedback' && styles.activeTab]}
            onPress={() => setSelectedTab('feedback')}
          >
            <Ionicons 
              name="chatbubble" 
              size={16} 
              color={selectedTab === 'feedback' ? Colors.primary[500] : Colors.text.secondary} 
            />
            <Text style={[styles.tabText, selectedTab === 'feedback' && styles.activeTabText]}>
              Feedback
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {selectedTab === 'progress' && renderProgressTab()}
        {selectedTab === 'approval' && renderApprovalTab()}
        {selectedTab === 'feedback' && renderFeedbackTab()}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
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
  headerSpacer: {
    width: 40,
  },
  workInfo: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.secondary,
  },
  workTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  workSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  activeTab: {
    backgroundColor: Colors.primary[50],
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.primary[500],
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  progressPhoto: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  workflowStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepNumber: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  stepStatus: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.warning[50],
    borderRadius: BorderRadius.md,
  },
  issueText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    flex: 1,
  },
  completionNotes: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    lineHeight: 20,
    padding: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
  },
  checklist: {
    gap: Spacing.sm,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checklistText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  starButton: {
    padding: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  approveButton: {
    backgroundColor: Colors.success[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  approveButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  changeRequestInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  requestChangesButton: {
    backgroundColor: Colors.warning[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  requestChangesButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
})
