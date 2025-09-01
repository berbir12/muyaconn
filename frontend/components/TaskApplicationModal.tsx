import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTaskApplications } from '../hooks/useTasks'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import TaskerApplicationModal from './TaskerApplicationModal'

interface TaskApplicationModalProps {
  visible: boolean
  onClose: () => void
  taskId: string
  taskTitle: string
  budget: number
  onApplicationSubmitted?: () => void
}

export default function TaskApplicationModal({
  visible,
  onClose,
  taskId,
  taskTitle,
  budget,
  onApplicationSubmitted,
}: TaskApplicationModalProps) {
  const hookResult = useTaskApplications(taskId)
  const { applyToTask, profile } = hookResult
  const [proposedPrice, setProposedPrice] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [availabilityDate, setAvailabilityDate] = useState(new Date())
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTaskerApplication, setShowTaskerApplication] = useState(false)

  // No need to check application status since we removed that logic

  const handleSubmit = async () => {
    if (!proposedPrice || !estimatedTime || !message) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    // Check if user is verified as a tasker before allowing submission
    if (profile?.role === 'customer' || !profile?.role) {
      Alert.alert(
        'Tasker Verification Required',
        'You must become a verified tasker before applying for tasks. Please use the "Apply to Become a Tasker" button above to submit your application.',
        [{ text: 'OK' }]
      )
      return
    }

    const price = parseFloat(proposedPrice)
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Price must be greater than 0')
      return
    }

    const time = parseFloat(estimatedTime)
    if (isNaN(time) || time <= 0) {
      Alert.alert('Error', 'Please enter a valid estimated time')
      return
    }



    // Check if user is authenticated
    if (!profile || !profile.id) {
      Alert.alert('Error', 'You must be logged in to submit an application')
      return
    }

    try {
      setLoading(true)
      
      if (typeof applyToTask !== 'function') {
        throw new Error('applyToTask is not a function')
      }
      
      const result = await applyToTask(taskId, {
        message,
        proposed_price: price,
        estimated_time: time,
        availability_date: availabilityDate.toISOString(),
      })
      
      console.log('=== Application submitted successfully ===')
      console.log('Result:', result)
      
      Alert.alert('Success', 'Application submitted successfully!', [
        { 
          text: 'OK', 
          onPress: () => {
            onClose()
            onApplicationSubmitted?.()
          }
        }
      ])
         } catch (error: any) {
       console.error('=== Application submission failed ===')
       console.error('Error:', error)
       console.error('Error message:', error.message)
       console.error('Error stack:', error.stack)
       
       let errorMessage = error.message || 'Failed to submit application'
       
       // Provide more helpful error messages
       if (error.message?.includes('must become a verified tasker') || 
           error.message?.includes('not verified as a tasker')) {
         errorMessage = 'You must become a verified tasker before applying for tasks. Please use the "Apply to Become a Tasker" button above to submit your application.'
       } else if (error.message?.includes('role') || error.message?.includes('must update')) {
         errorMessage = 'You need to become a verified tasker first. Please use the "Apply to Become a Tasker" button above to submit your application.'
       } else if (error.message?.includes('permission') || error.message?.includes('policy')) {
         errorMessage = 'Permission denied. This usually means you need to become a verified tasker. Please use the "Apply to Become a Tasker" button above.'
       }
       
       Alert.alert('Error', errorMessage)
     } finally {
      setLoading(false)
    }
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setAvailabilityDate(selectedDate)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

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
           <View style={{ alignItems: 'center' }}>
             <Text style={styles.headerTitle}>Apply for Task</Text>
             <Text style={styles.roleIndicator}>
               Current Role: {profile?.role || 'Unknown'}
             </Text>
           </View>
           <View style={styles.placeholder} />
         </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Task Info */}
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>{taskTitle}</Text>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetLabel}>Budget:</Text>
              <Text style={styles.budgetRange}>
                ${budget}
              </Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Proposed Price ($)</Text>
              <TextInput
                style={styles.input}
                value={proposedPrice}
                onChangeText={setProposedPrice}
                placeholder={`Suggested: $${budget}`}
                keyboardType="numeric"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Estimated Time (hours)</Text>
              <TextInput
                style={styles.input}
                value={estimatedTime}
                onChangeText={setEstimatedTime}
                placeholder="e.g., 4"
                keyboardType="numeric"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Available Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={Colors.text.secondary} />
                <Text style={styles.dateButtonText}>{formatDate(availabilityDate)}</Text>
                <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Why should they choose you?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your experience, skills, and why you're the best fit for this task..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>
          </View>





          {/* Tasker Application Section - Show if user needs to become a tasker */}
          {(profile?.role === 'customer' || !profile?.role) && (
            <View style={styles.roleUpdateSection}>
              <Text style={styles.roleUpdateTitle}>Become a Tasker</Text>
              <Text style={styles.roleUpdateDescription}>
                To apply for tasks, you need to become a verified tasker. This involves submitting an application with your personal information, skills, and verification documents. Our team will review your application within 2-3 business days.
              </Text>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#28a745', marginBottom: 8 }]}
                onPress={() => setShowTaskerApplication(true)}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>Apply to Become a Tasker</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Submit Application</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={availabilityDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Tasker Application Modal */}
        <TaskerApplicationModal
          visible={showTaskerApplication}
          onClose={() => setShowTaskerApplication(false)}
          onApplicationSubmitted={() => {
            setShowTaskerApplication(false)
            // Optionally refresh the profile or show success message
            Alert.alert(
              'Application Submitted! 🎉',
              'Your tasker application has been submitted successfully. You will be notified once it is reviewed. For now, you can continue browsing tasks.',
              [{ text: 'OK' }]
            )
          }}
        />

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
  roleIndicator: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  taskInfo: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  taskTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  budgetLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  budgetRange: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[500],
  },
  form: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
  },
  dateButtonText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.neutral[400],
  },
  submitButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  roleUpdateSection: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  roleUpdateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  roleUpdateDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
})
