import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import WorkflowManager from './WorkflowManager'
import CustomerApprovalModal from './CustomerApprovalModal'

interface WorkflowIntegrationProps {
  workItem: {
    id: string
    type: 'task'
    title: string
    status: string
    otherPartyName: string
    startDate: string
    estimatedDuration?: number
    data: any
  }
  userRole: 'customer' | 'tasker' | 'both'
  onStatusUpdate: (newStatus: string) => void
  onWorkflowComplete: (completionData: any) => void
}

export default function WorkflowIntegration({
  workItem,
  userRole,
  onStatusUpdate,
  onWorkflowComplete
}: WorkflowIntegrationProps) {
  const [showWorkflowManager, setShowWorkflowManager] = useState(false)
  const [showCustomerApproval, setShowCustomerApproval] = useState(false)
  const [workflowData, setWorkflowData] = useState<any>(null)
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<string>('')

  // Determine what actions are available based on user role and work status
  const getAvailableActions = () => {
    const actions = []

    if (userRole === 'tasker' || userRole === 'both') {
      // Tasker actions
      switch (workItem.status) {
        case 'confirmed':
          actions.push({
            id: 'start_work',
            title: 'Start Work',
            description: 'Begin the workflow and start working',
            icon: 'play-circle',
            color: Colors.primary[500],
            action: () => handleStartWork()
          })
          break
        case 'in_progress':
          actions.push({
            id: 'manage_workflow',
            title: 'Manage Workflow',
            description: 'Track progress and manage workflow steps',
            icon: 'list',
            color: Colors.primary[500],
            action: () => setShowWorkflowManager(true)
          })
          break
        case 'pending_approval':
          actions.push({
            id: 'view_approval',
            title: 'Awaiting Approval',
            description: 'Customer is reviewing your work',
            icon: 'time',
            color: Colors.warning[500],
            action: () => handleViewApprovalStatus()
          })
          break
      }
    }

    if (userRole === 'customer' || userRole === 'both') {
      // Customer actions
      switch (workItem.status) {
        case 'in_progress':
          actions.push({
            id: 'view_progress',
            title: 'View Progress',
            description: 'See updates and progress on your work',
            icon: 'eye',
            color: Colors.primary[500],
            action: () => handleViewProgress()
          })
          break
        case 'pending_approval':
          actions.push({
            id: 'review_work',
            title: 'Review & Approve',
            description: 'Review completed work and provide approval',
            icon: 'checkmark-circle',
            color: Colors.success[500],
            action: () => setShowCustomerApproval(true)
          })
          break
      }
    }

    return actions
  }

  const handleStartWork = async () => {
    try {
      // Update work status to in_progress
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', workItem.id)

      if (error) throw error

      // Update local status
      onStatusUpdate('in_progress')

      // Show workflow manager
      setShowWorkflowManager(true)

      // Send notification to customer
      await sendWorkflowNotification('work_started', workItem.data.customer_id)

    } catch (error: any) {
      Alert.alert('Error', 'Failed to start work. Please try again.')
      console.error('Error starting work:', error)
    }
  }

  const handleViewProgress = () => {
    // For customers, show a read-only view of progress
    // This could be a simplified version of the workflow manager
    Alert.alert('Progress View', 'Progress tracking will be available soon.')
  }

  const handleViewApprovalStatus = () => {
    Alert.alert('Approval Status', 'Your work is currently being reviewed by the customer.')
  }

  const handleWorkflowComplete = async (completionData: any) => {
    try {
      // Update work status to pending_approval
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'pending_approval',
          completed_at: new Date().toISOString()
        })
        .eq('id', workItem.id)

      if (error) throw error

      // Store workflow data
      setWorkflowData(completionData)

      // Update local status
      onStatusUpdate('pending_approval')

      // Send notification to customer
      await sendWorkflowNotification('work_completed', workItem.data.customer_id)

      // Close workflow manager
      setShowWorkflowManager(false)

      // Show success message
      Alert.alert(
        'Work Completed! 🎉',
        'Your work has been completed and is now pending customer approval.',
        [{ text: 'OK' }]
      )

    } catch (error: any) {
      Alert.alert('Error', 'Failed to complete work. Please try again.')
      console.error('Error completing work:', error)
    }
  }

  const handleCustomerApproval = async (approvalData: any) => {
    try {
      // Update work status to completed
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          customer_rating: approvalData.rating,
          customer_review: approvalData.notes
        })
        .eq('id', workItem.id)

      if (error) throw error

      // Update local status
      onStatusUpdate('completed')

      // Send notification to tasker
      await sendWorkflowNotification('work_approved', workItem.data.tasker_id)

      // Close customer approval modal
      setShowCustomerApproval(false)

      // Show success message
      Alert.alert(
        'Work Approved! ✅',
        'Thank you for your approval. The work has been marked as completed.',
        [{ text: 'OK' }]
      )

      // Call the completion callback
      onWorkflowComplete({
        ...approvalData,
        workflowData,
        finalStatus: 'completed'
      })

    } catch (error: any) {
      Alert.alert('Error', 'Failed to approve work. Please try again.')
      console.error('Error approving work:', error)
    }
  }

  const handleCustomerChangeRequest = async (changeRequestData: any) => {
    try {
      // Update work status back to in_progress
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', workItem.id)

      if (error) throw error

      // Update local status
      onStatusUpdate('in_progress')

      // Send notification to tasker
      await sendWorkflowNotification('changes_requested', workItem.data.tasker_id)

      // Close customer approval modal
      setShowCustomerApproval(false)

      // Show message
      Alert.alert(
        'Changes Requested',
        'Your change request has been sent to the worker. They will review and respond.',
        [{ text: 'OK' }]
      )

    } catch (error: any) {
      Alert.alert('Error', 'Failed to request changes. Please try again.')
      console.error('Error requesting changes:', error)
    }
  }

  const sendWorkflowNotification = async (type: string, userId: string) => {
    try {
      const notificationData = {
        user_id: userId,
        title: getNotificationTitle(type),
        message: getNotificationMessage(type, workItem),
        type: 'workflow',
        data: {
          work_id: workItem.id,
          work_type: workItem.type,
          notification_type: type
        }
      }

      const { error } = await supabase
        .from('notifications')
        .insert(notificationData)

      if (error) {
        console.error('Failed to send workflow notification:', error)
      }
    } catch (error) {
      console.error('Error sending workflow notification:', error)
    }
  }

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'work_started': return 'Work Started! 🚀'
      case 'work_completed': return 'Work Completed! ✅'
      case 'work_approved': return 'Work Approved! 🎉'
      case 'changes_requested': return 'Changes Requested 📝'
      default: return 'Workflow Update'
    }
  }

  const getNotificationMessage = (type: string, work: any) => {
    switch (type) {
      case 'work_started': 
        return `Work has started on "${work.title}". You'll receive progress updates.`
      case 'work_completed': 
        return `Work on "${work.title}" has been completed and is ready for your review.`
      case 'work_approved': 
        return `Your work on "${work.title}" has been approved by the customer!`
      case 'changes_requested': 
        return `The customer has requested changes for "${work.title}". Please review and respond.`
      default: 
        return `There's an update on "${work.title}".`
    }
  }

  const getStatusDisplay = () => {
    switch (workItem.status) {
      case 'confirmed':
        return {
          text: 'Ready to Start',
          color: Colors.success[500],
          icon: 'checkmark-circle'
        }
      case 'in_progress':
        return {
          text: 'Work in Progress',
          color: Colors.primary[500],
          icon: 'play-circle'
        }
      case 'pending_approval':
        return {
          text: 'Pending Approval',
          color: Colors.warning[500],
          icon: 'time'
        }
      case 'completed':
        return {
          text: 'Completed',
          color: Colors.success[600],
          icon: 'checkmark-done-circle'
        }
      default:
        return {
          text: workItem.status,
          color: Colors.neutral[400],
          icon: 'help-circle'
        }
    }
  }

  const statusDisplay = getStatusDisplay()
  const availableActions = getAvailableActions()

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={styles.statusInfo}>
          <Ionicons name={statusDisplay.icon as any} size={20} color={statusDisplay.color} />
          <Text style={[styles.statusText, { color: statusDisplay.color }]}>
            {statusDisplay.text}
          </Text>
        </View>
        <Text style={styles.statusDescription}>
          {getStatusDescription(workItem.status)}
        </Text>
      </View>

      {/* Available Actions */}
      {availableActions.length > 0 && (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Available Actions</Text>
          {availableActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionButton, { borderColor: action.color }]}
              onPress={action.action}
            >
              <Ionicons name={action.icon as any} size={20} color={action.color} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Workflow Manager Modal */}
      <WorkflowManager
        visible={showWorkflowManager}
        onClose={() => setShowWorkflowManager(false)}
        workItem={workItem}
        onUpdateStatus={onStatusUpdate}
        onComplete={handleWorkflowComplete}
      />

      {/* Customer Approval Modal */}
      <CustomerApprovalModal
        visible={showCustomerApproval}
        onClose={() => setShowCustomerApproval(false)}
        workItem={workItem}
        workflowData={workflowData || {}}
        onApprove={handleCustomerApproval}
        onRequestChanges={handleCustomerChangeRequest}
      />
    </View>
  )
}

const getStatusDescription = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Work is confirmed and ready to begin. The worker will start the workflow when ready.'
    case 'in_progress':
      return 'Work is currently being performed. Track progress and receive updates.'
    case 'pending_approval':
      return 'Work has been completed and is awaiting your review and approval.'
    case 'completed':
      return 'Work has been completed and approved. Thank you for using our service!'
    default:
      return 'Work status is being updated.'
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  statusHeader: {
    marginBottom: Spacing.lg,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  statusDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: Spacing.md,
  },
  actionsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  actionDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
})
