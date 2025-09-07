import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import ChapaPaymentService from '../services/ChapaPaymentService'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface PaymentModalProps {
  visible: boolean
  onClose: () => void
  onPaymentSuccess: () => void
  task: {
    id: string
    title: string
    budget: number
    tasker_profile?: {
      full_name: string
    }
  }
  customer: {
    email: string
    full_name: string
    phone?: string
  }
}

export default function PaymentModal({
  visible,
  onClose,
  onPaymentSuccess,
  task,
  customer
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'processing' | 'redirect'>('confirm')

  const handlePayWithChapa = async () => {
    try {
      setLoading(true)
      setPaymentStep('processing')

      // Process payment
      const { checkoutUrl, txRef } = await ChapaPaymentService.processTaskPayment(
        task.id,
        task.budget,
        customer.email,
        customer.full_name,
        customer.phone || ''
      )

      setPaymentStep('redirect')

      // Open Chapa checkout in browser
      const canOpen = await Linking.canOpenURL(checkoutUrl)
      if (canOpen) {
        await Linking.openURL(checkoutUrl)
        
        // Show success message
        Alert.alert(
          'Payment Initiated',
          'Your payment has been initiated. You will be redirected to Chapa to complete the payment.',
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentSuccess()
                onClose()
              }
            }
          ]
        )
      } else {
        throw new Error('Cannot open payment URL')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      Alert.alert(
        'Payment Failed',
        error.message || 'Failed to process payment. Please try again.',
        [{ text: 'OK' }]
      )
      setPaymentStep('confirm')
    } finally {
      setLoading(false)
    }
  }

  const renderConfirmStep = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="card" size={32} color={Colors.primary[500]} />
        </View>
        <Text style={styles.title}>Complete Payment</Text>
        <Text style={styles.subtitle}>
          Pay for the completed task to release funds to the tasker
        </Text>
      </View>

      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskerName}>
          Completed by {task.tasker_profile?.full_name || 'Tasker'}
        </Text>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>ETB {task.budget}</Text>
        </View>
      </View>

      <View style={styles.paymentInfo}>
        <View style={styles.paymentMethod}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.success[500]} />
          <Text style={styles.paymentMethodText}>Secure payment powered by Chapa</Text>
        </View>
        <Text style={styles.paymentNote}>
          Your payment is secure and encrypted. Funds will be released to the tasker after successful payment.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayWithChapa}
          disabled={loading}
        >
          <LinearGradient
            colors={[Colors.primary[500], Colors.primary[600]]}
            style={styles.payButtonGradient}
          >
            <Ionicons name="card" size={20} color={Colors.text.inverse} />
            <Text style={styles.payButtonText}>Pay with Chapa</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderProcessingStep = () => (
    <View style={styles.content}>
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.processingTitle}>Processing Payment</Text>
        <Text style={styles.processingSubtitle}>
          Please wait while we prepare your payment...
        </Text>
      </View>
    </View>
  )

  const renderRedirectStep = () => (
    <View style={styles.content}>
      <View style={styles.processingContainer}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success[500]} />
        <Text style={styles.processingTitle}>Redirecting to Payment</Text>
        <Text style={styles.processingSubtitle}>
          You will be redirected to Chapa to complete your payment securely.
        </Text>
      </View>
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {paymentStep === 'confirm' && renderConfirmStep()}
        {paymentStep === 'processing' && renderProcessingStep()}
        {paymentStep === 'redirect' && renderRedirectStep()}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  taskInfo: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  taskTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  taskerName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  amountLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  amount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[500],
  },
  paymentInfo: {
    marginBottom: Spacing.xl,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentMethodText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success[600],
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  paymentNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  payButton: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  payButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  processingSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
})
