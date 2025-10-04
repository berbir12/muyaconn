import { supabase } from '../lib/supabase'

export interface Booking {
  id: string
  customer_id: string
  technician_id: string
  service_name: string
  service_description?: string
  base_price: number
  agreed_price: number
  price_type: 'hourly' | 'fixed' | 'negotiable'
  booking_date: string
  start_time: string
  end_time?: string
  estimated_duration_hours?: number
  city?: string
  state?: string
  address?: string
  zip_code?: string
  latitude?: number
  longitude?: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_amount?: number
  payment_status: 'pending' | 'paid' | 'refunded'
  customer_notes?: string
  technician_notes?: string
  special_instructions?: string
  created_at: string
  updated_at: string
  // Additional fields for display
  customer_name?: string
  technician_name?: string
  task_title?: string
}

export class BookingService {
  // Get all bookings for a user (as customer or technician)
  static async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('direct_bookings')
        .select(`
          *,
          profiles!direct_bookings_customer_id_fkey(full_name),
          profiles!direct_bookings_technician_id_fkey(full_name)
        `)
        .or(`customer_id.eq.${userId},technician_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(booking => ({
        ...booking,
        customer_name: booking.profiles?.full_name,
        technician_name: booking.profiles?.full_name,
        task_title: booking.service_name
      }))
    } catch (error) {
      console.error('Error getting user bookings:', error)
      return []
    }
  }

  // Get bookings by status
  static async getBookingsByStatus(userId: string, status: Booking['status']): Promise<Booking[]> {
    try {
      const bookings = await this.getUserBookings(userId)
      return bookings.filter(booking => booking.status === status)
    } catch (error) {
      console.error('Error getting bookings by status:', error)
      return []
    }
  }

  // Create a new booking
  static async createBooking(bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'customer_name' | 'technician_name' | 'task_title'>): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('direct_bookings')
        .insert([bookingData])
        .select(`
          *,
          profiles!direct_bookings_customer_id_fkey(full_name),
          profiles!direct_bookings_technician_id_fkey(full_name)
        `)
        .single()

      if (error) throw error

      return {
        ...data,
        customer_name: data.profiles?.full_name,
        technician_name: data.profiles?.full_name,
        task_title: data.service_name
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      throw error
    }
  }

  // Update booking status
  static async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('direct_bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating booking status:', error)
      return false
    }
  }

  // Update booking details
  static async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('direct_bookings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating booking:', error)
      return false
    }
  }

  // Cancel booking
  static async cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
    try {
      const success = await this.updateBookingStatus(bookingId, 'cancelled')
      if (success && reason) {
        await this.updateBooking(bookingId, { special_instructions: reason })
      }
      return success
    } catch (error) {
      console.error('Error cancelling booking:', error)
      return false
    }
  }

  // Complete booking
  static async completeBooking(bookingId: string, notes?: string): Promise<boolean> {
    try {
      const success = await this.updateBookingStatus(bookingId, 'completed')
      if (success && notes) {
        await this.updateBooking(bookingId, { technician_notes: notes })
      }
      return success
    } catch (error) {
      console.error('Error completing booking:', error)
      return false
    }
  }

  // Get booking by ID
  static async getBookingById(bookingId: string): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('direct_bookings')
        .select(`
          *,
          profiles!direct_bookings_customer_id_fkey(full_name),
          profiles!direct_bookings_technician_id_fkey(full_name)
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error

      return {
        ...data,
        customer_name: data.profiles?.full_name,
        technician_name: data.profiles?.full_name,
        task_title: data.service_name
      }
    } catch (error) {
      console.error('Error getting booking by ID:', error)
      return null
    }
  }

  // Search bookings
  static async searchBookings(userId: string, query: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('direct_bookings')
        .select(`
          *,
          profiles!direct_bookings_customer_id_fkey(full_name),
          profiles!direct_bookings_technician_id_fkey(full_name)
        `)
        .or(`customer_id.eq.${userId},technician_id.eq.${userId}`)
        .or(`service_name.ilike.%${query}%,address.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(booking => ({
        ...booking,
        customer_name: booking.profiles?.full_name,
        technician_name: booking.profiles?.full_name,
        task_title: booking.service_name
      }))
    } catch (error) {
      console.error('Error searching bookings:', error)
      return []
    }
  }

  // Get upcoming bookings
  static async getUpcomingBookings(userId: string): Promise<Booking[]> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('direct_bookings')
        .select(`
          *,
          profiles!direct_bookings_customer_id_fkey(full_name),
          profiles!direct_bookings_technician_id_fkey(full_name)
        `)
        .or(`customer_id.eq.${userId},technician_id.eq.${userId}`)
        .gte('booking_date', today)
        .in('status', ['confirmed', 'in_progress'])
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error

      return data.map(booking => ({
        ...booking,
        customer_name: booking.profiles?.full_name,
        technician_name: booking.profiles?.full_name,
        task_title: booking.service_name
      }))
    } catch (error) {
      console.error('Error getting upcoming bookings:', error)
      return []
    }
  }

  // Get booking statistics
  static async getBookingStats(userId: string): Promise<{
    total: number
    pending: number
    confirmed: number
    in_progress: number
    completed: number
    cancelled: number
  }> {
    try {
      const bookings = await this.getUserBookings(userId)
      
      return {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        in_progress: bookings.filter(b => b.status === 'in_progress').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
      }
    } catch (error) {
      console.error('Error getting booking stats:', error)
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      }
    }
  }
}