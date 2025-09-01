import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  required: boolean
  data?: any
}

interface WorkflowManagerProps {
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
  onUpdateStatus: (newStatus: string) => void
  onComplete: (completionData: any) => void
}

export default function WorkflowManager({
  visible,
  onClose,
  workItem,
  onUpdateStatus,
  onComplete
}: WorkflowManagerProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)
  const [progressPhotos, setProgressPhotos] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [issues, setIssues] = useState<string[]>([])
  const [completionData, setCompletionData] = useState<any>({})

  // Initialize workflow steps based on work type and status
  useEffect(() => {
    if (workItem) {
      const steps = getWorkflowSteps(workItem)
      setWorkflowSteps(steps)
    }
  }, [workItem])

  const getWorkflowSteps = (item: any): WorkflowStep[] => {
    const baseSteps: WorkflowStep[] = [
      {
        id: 'coordination',
        title: 'Pre-Work Coordination',
        description: 'Confirm details, schedule, and requirements',
        status: 'pending',
        required: true
      },
      {
        id: 'preparation',
        title: 'Work Preparation',
        description: 'Gather materials, tools, and prepare for work',
        status: 'pending',
        required: true
      },
      {
        id: 'execution',
        title: 'Work Execution',
        description: 'Perform the work with progress updates',
        status: 'pending',
        required: true
      },
      {
        id: 'completion',
        title: 'Work Completion',
        description: 'Final inspection and customer approval',
        status: 'pending',
        required: true
      },
      {
        id: 'handoff',
        title: 'Handoff & Payment',
        description: 'Complete payment and handoff documentation',
        status: 'pending',
        required: true
      }
    ]

    // Add conditional steps based on work type
    if (item.type === 'task') {
      baseSteps.splice(1, 0, {
        id: 'site_visit',
        title: 'Site Visit (if needed)',
        description: 'Visit location to assess requirements',
        status: 'pending',
        required: false
      })
    }

    return baseSteps
  }

  const handleStepComplete = (stepId: string, data?: any) => {
    const updatedSteps = workflowSteps.map(step => 
      step.id === stepId 
        ? { ...step, status: 'completed', data }
        : step
    )
    setWorkflowSteps(updatedSteps)

    // Move to next step
    const currentIndex = workflowSteps.findIndex(step => step.id === stepId)
    if (currentIndex < workflowSteps.length - 1) {
      setCurrentStep(currentIndex + 1)
    }
  }

  const handleStepSkip = (stepId: string) => {
    const updatedSteps = workflowSteps.map(step => 
      step.id === stepId 
        ? { ...step, status: 'skipped' }
        : step
    )
    setWorkflowSteps(updatedSteps)

    // Move to next step
    const currentIndex = workflowSteps.findIndex(step => step.id === stepId)
    if (currentIndex < workflowSteps.length - 1) {
      setCurrentStep(currentIndex + 1)
    }
  }

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setProgressPhotos([...progressPhotos, result.assets[0].uri])
        setShowPhotoPicker(false)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setProgressPhotos([...progressPhotos, result.assets[0].uri])
        setShowPhotoPicker(false)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photo')
    }
  }

  const handleAddIssue = () => {
    if (notes.trim()) {
      setIssues([...issues, notes])
      setNotes('')
    }
  }

  const handleCompleteWork = () => {
    const completionData = {
      progressPhotos,
      issues,
      completionNotes: notes,
      completedAt: new Date().toISOString(),
      workflowSteps: workflowSteps.map(step => ({
        id: step.id,
        status: step.status,
        data: step.data
      }))
    }

    setCompletionData(completionData)
    onComplete(completionData)
  }

  const renderStepContent = (step: WorkflowStep) => {
    switch (step.id) {
      case 'coordination':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Before starting work, confirm these details with the customer:
            </Text>
            
            <View style={styles.coordinationList}>
              <View style={styles.coordinationItem}>
                <Ionicons name="calendar" size={20} color={Colors.primary[500]} />
                <Text style={styles.coordinationText}>Confirm work date and time</Text>
              </View>
              <View style={styles.coordinationItem}>
                <Ionicons name="location" size={20} color={Colors.primary[500]} />
                <Text style={styles.coordinationText}>Verify exact location/address</Text>
              </View>
              <View style={styles.coordinationItem}>
                <Ionicons name="list" size={20} color={Colors.primary[500]} />
                <Text style={styles.coordinationText}>Review specific requirements</Text>
              </View>
              <View style={styles.coordinationItem}>
                <Ionicons name="card" size={20} color={Colors.primary[500]} />
                <Text style={styles.coordinationText}>Confirm final price and payment</Text>
              </View>
            </View>

            <View style={styles.stepActions}>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => handleStepComplete('coordination')}
              >
                <Text style={styles.completeButtonText}>Coordination Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )

      case 'preparation':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Prepare everything needed for the work:
            </Text>
            
            <View style={styles.preparationList}>
              <View style={styles.preparationItem}>
                <Ionicons name="hammer" size={20} color={Colors.primary[500]} />
                <Text style={styles.preparationText}>Gather required tools and materials</Text>
              </View>
              <View style={styles.preparationItem}>
                <Ionicons name="time" size={20} color={Colors.primary[500]} />
                <Text style={styles.preparationText}>Plan work timeline and approach</Text>
              </View>
              <View style={styles.preparationItem}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.primary[500]} />
                <Text style={styles.preparationText}>Ensure safety measures</Text>
              </View>
            </View>

            <View style={styles.stepActions}>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => handleStepComplete('preparation')}
              >
                <Text style={styles.completeButtonText}>Preparation Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )

      case 'execution':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Track your work progress and keep the customer updated:
            </Text>
            
            <View style={styles.executionSection}>
              <Text style={styles.sectionTitle}>Progress Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {progressPhotos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.progressPhoto} />
                ))}
                <TouchableOpacity 
                  style={styles.addPhotoButton}
                  onPress={() => setShowPhotoPicker(true)}
                >
                  <Ionicons name="camera" size={24} color={Colors.primary[500]} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.executionSection}>
              <Text style={styles.sectionTitle}>Progress Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Update customer on progress..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.executionSection}>
              <Text style={styles.sectionTitle}>Issues or Changes</Text>
              {issues.map((issue, index) => (
                <View key={index} style={styles.issueItem}>
                  <Ionicons name="warning" size={16} color={Colors.warning[500]} />
                  <Text style={styles.issueText}>{issue}</Text>
                </View>
              ))}
              <TouchableOpacity 
                style={styles.addIssueButton}
                onPress={handleAddIssue}
              >
                <Ionicons name="add-circle" size={20} color={Colors.primary[500]} />
                <Text style={styles.addIssueText}>Add Issue</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stepActions}>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => handleStepComplete('execution')}
              >
                <Text style={styles.completeButtonText}>Work Execution Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )

      case 'completion':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Final inspection and customer approval:
            </Text>
            
            <View style={styles.completionList}>
              <View style={styles.completionItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success[500]} />
                <Text style={styles.completionText}>Work meets quality standards</Text>
              </View>
              <View style={styles.completionItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success[500]} />
                <Text style={styles.completionText}>Customer is satisfied</Text>
              </View>
              <View style={styles.completionItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success[500]} />
                <Text style={styles.completionText}>Site is clean and organized</Text>
              </View>
              <View style={styles.completionItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success[500]} />
                <Text style={styles.completionText}>All requirements completed</Text>
              </View>
            </View>

            <View style={styles.stepActions}>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => handleStepComplete('completion')}
              >
                <Text style={styles.completeButtonText}>Work Completion Verified</Text>
              </TouchableOpacity>
            </View>
          </View>
        )

      case 'handoff':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Complete the handoff and payment process:
            </Text>
            
            <View style={styles.handoffList}>
              <View style={styles.handoffItem}>
                <Ionicons name="card" size={20} color={Colors.primary[500]} />
                <Text style={styles.handoffText}>Process final payment</Text>
              </View>
              <View style={styles.handoffItem}>
                <Ionicons name="document-text" size={20} color={Colors.primary[500]} />
                <Text style={styles.handoffText}>Provide completion documentation</Text>
              </View>
              <View style={styles.handoffItem}>
                <Ionicons name="star" size={20} color={Colors.primary[500]} />
                <Text style={styles.handoffText}>Request customer review</Text>
              </View>
              <View style={styles.handoffItem}>
                <Ionicons name="handshake" size={20} color={Colors.primary[500]} />
                <Text style={styles.handoffText}>Confirm handoff completion</Text>
              </View>
            </View>

            <View style={styles.stepActions}>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={handleCompleteWork}
              >
                <Text style={styles.completeButtonText}>Complete Handoff</Text>
              </TouchableOpacity>
            </View>
          </View>
        )

      default:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>Step content not available</Text>
          </View>
        )
    }
  }

  const renderWorkflowProgress = () => {
    return (
      <View style={styles.progressContainer}>
        {workflowSteps.map((step, index) => (
          <View key={step.id} style={styles.progressStep}>
            <View style={[
              styles.progressIndicator,
              {
                backgroundColor: step.status === 'completed' 
                  ? Colors.success[500] 
                  : step.status === 'in_progress'
                  ? Colors.primary[500]
                  : step.status === 'skipped'
                  ? Colors.neutral[400]
                  : Colors.neutral[300]
              }
            ]}>
              {step.status === 'completed' ? (
                <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
              ) : (
                <Text style={styles.progressNumber}>{index + 1}</Text>
              )}
            </View>
            <View style={styles.progressText}>
              <Text style={[
                styles.progressTitle,
                { color: step.status === 'completed' ? Colors.success[600] : Colors.text.primary }
              ]}>
                {step.title}
              </Text>
              <Text style={styles.progressDescription}>{step.description}</Text>
            </View>
          </View>
        ))}
      </View>
    )
  }

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
          <Text style={styles.headerTitle}>Workflow Manager</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Work Item Info */}
        <View style={styles.workInfo}>
          <Text style={styles.workTitle}>{workItem.title}</Text>
          <Text style={styles.workSubtitle}>
            {workItem.type === 'task' ? 'Task' : 'Direct Booking'} • {workItem.otherPartyName}
          </Text>
        </View>

        {/* Progress Bar */}
        {renderWorkflowProgress()}

        {/* Current Step Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {workflowSteps[currentStep] && renderStepContent(workflowSteps[currentStep])}
        </ScrollView>

        {/* Photo Picker Modal */}
        <Modal
          visible={showPhotoPicker}
          transparent
          animationType="fade"
        >
          <View style={styles.photoPickerOverlay}>
            <View style={styles.photoPickerContainer}>
              <Text style={styles.photoPickerTitle}>Add Progress Photo</Text>
              <View style={styles.photoPickerActions}>
                <TouchableOpacity style={styles.photoPickerButton} onPress={handleTakePhoto}>
                  <Ionicons name="camera" size={24} color={Colors.primary[500]} />
                  <Text style={styles.photoPickerButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoPickerButton} onPress={handlePickPhoto}>
                  <Ionicons name="images" size={24} color={Colors.primary[500]} />
                  <Text style={styles.photoPickerButtonText}>Choose from Library</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPhotoPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  progressNumber: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  progressText: {
    flex: 1,
  },
  progressTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  progressDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stepContent: {
    paddingVertical: Spacing.lg,
  },
  stepDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  coordinationList: {
    marginBottom: Spacing.lg,
  },
  coordinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  coordinationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  preparationList: {
    marginBottom: Spacing.lg,
  },
  preparationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  preparationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  executionSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  progressPhoto: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary[500],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  addPhotoText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary[500],
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
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
  addIssueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  addIssueText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[500],
  },
  completionList: {
    marginBottom: Spacing.lg,
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  completionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  handoffList: {
    marginBottom: Spacing.lg,
  },
  handoffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  handoffText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  stepActions: {
    marginTop: Spacing.lg,
  },
  completeButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  completeButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  photoPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPickerContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    margin: Spacing.lg,
    alignItems: 'center',
  },
  photoPickerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  photoPickerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  photoPickerButton: {
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    minWidth: 120,
  },
  photoPickerButtonText: {
    color: Colors.primary[500],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.xs,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  cancelButtonText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
  },
})
