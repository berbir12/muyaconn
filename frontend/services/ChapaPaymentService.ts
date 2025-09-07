import { supabase } from '../lib/supabase'

export interface ChapaPaymentRequest {
  amount: number
  currency: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  tx_ref: string
  callback_url?: string
  return_url?: string
  customization?: {
    title?: string
    description?: string
    logo?: string
  }
}

export interface ChapaPaymentResponse {
  status: string
  message: string
  data?: {
    checkout_url: string
    tx_ref: string
  }
}

export interface PaymentStatus {
  id: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  amount: number
  currency: string
  tx_ref: string
  created_at: string
  updated_at: string
}

export class ChapaPaymentService {
  private static readonly CHAPA_PUBLIC_KEY = process.env.EXPO_PUBLIC_CHAPA_PUBLIC_KEY || 'CHASECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  private static readonly CHAPA_BASE_URL = 'https://api.chapa.co/v1'

  /**
   * Initialize a payment with Chapa
   */
  static async initializePayment(paymentData: ChapaPaymentRequest): Promise<ChapaPaymentResponse> {
    try {
      const response = await fetch(`${this.CHAPA_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.CHAPA_PUBLIC_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to initialize payment')
      }

      return result
    } catch (error: any) {
      console.error('Chapa payment initialization error:', error)
      throw new Error(error.message || 'Payment initialization failed')
    }
  }

  /**
   * Verify payment status
   */
  static async verifyPayment(txRef: string): Promise<PaymentStatus> {
    try {
      const response = await fetch(`${this.CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.CHAPA_PUBLIC_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to verify payment')
      }

      return result.data
    } catch (error: any) {
      console.error('Chapa payment verification error:', error)
      throw new Error(error.message || 'Payment verification failed')
    }
  }

  /**
   * Create a payment record in the database
   */
  static async createPaymentRecord(
    taskId: string,
    amount: number,
    txRef: string,
    status: 'pending' | 'completed' | 'failed' | 'cancelled' = 'pending'
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          task_id: taskId,
          amount,
          currency: 'ETB',
          tx_ref: txRef,
          status,
          payment_method: 'chapa',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error

      return data.id
    } catch (error: any) {
      console.error('Error creating payment record:', error)
      throw new Error('Failed to create payment record')
    }
  }

  /**
   * Update payment status in the database
   */
  static async updatePaymentStatus(
    paymentId: string,
    status: 'pending' | 'completed' | 'failed' | 'cancelled',
    chapaData?: any
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (chapaData) {
        updateData.chapa_response = chapaData
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error updating payment status:', error)
      throw new Error('Failed to update payment status')
    }
  }

  /**
   * Update task payment status
   */
  static async updateTaskPaymentStatus(
    taskId: string,
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          payment_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error updating task payment status:', error)
      throw new Error('Failed to update task payment status')
    }
  }

  /**
   * Generate a unique transaction reference
   */
  static generateTxRef(taskId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `task_${taskId}_${timestamp}_${random}`
  }

  /**
   * Process payment for a completed task
   */
  static async processTaskPayment(
    taskId: string,
    amount: number,
    customerEmail: string,
    customerName: string,
    customerPhone: string
  ): Promise<{ checkoutUrl: string; txRef: string }> {
    try {
      // Generate unique transaction reference
      const txRef = this.generateTxRef(taskId)

      // Create payment record
      const paymentId = await this.createPaymentRecord(taskId, amount, txRef, 'pending')

      // Initialize payment with Chapa
      const paymentRequest: ChapaPaymentRequest = {
        amount,
        currency: 'ETB',
        email: customerEmail,
        first_name: customerName.split(' ')[0] || customerName,
        last_name: customerName.split(' ').slice(1).join(' ') || '',
        phone_number: customerPhone,
        tx_ref: txRef,
        callback_url: `${process.env.EXPO_PUBLIC_API_URL}/api/payments/chapa/callback`,
        return_url: `${process.env.EXPO_PUBLIC_APP_URL}/payment/success`,
        customization: {
          title: 'Task Payment',
          description: `Payment for completed task ${taskId}`,
        }
      }

      const paymentResponse = await this.initializePayment(paymentRequest)

      if (paymentResponse.status === 'success' && paymentResponse.data?.checkout_url) {
        // Update task payment status to pending
        await this.updateTaskPaymentStatus(taskId, 'pending')

        return {
          checkoutUrl: paymentResponse.data.checkout_url,
          txRef: txRef
        }
      } else {
        throw new Error(paymentResponse.message || 'Payment initialization failed')
      }
    } catch (error: any) {
      console.error('Error processing task payment:', error)
      throw error
    }
  }
}

export default ChapaPaymentService
