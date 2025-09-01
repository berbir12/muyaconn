import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { useBookings } from '../hooks/useBookings'
import Colors from '../constants/Colors'

interface Tasker {
  profile_id: string
  username: string
  full_name: string
  avatar_url?: string
  bio?: string
  hourly_rate: number
  is_available: boolean
  rating_average: number
  rating_count: number
  total_tasks_completed: number
  experience_years?: number
  skills: string[]
  certifications?: string[]
  languages?: string[]
  response_time?: string
  city?: string
  state?: string
}

interface BookingModalProps {
  visible: boolean
  tasker: Tasker | null
  onClose: () => void
  onSuccess?: () => void
}

export default function BookingModal({ visible, tasker, onClose, onSuccess }: BookingModalProps) {
  const { profile } = useAuth()
  const { createBooking } = useBookings()
  
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [agreedPrice, setAgreedPrice] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Early return checks
  if (!visible) return null
  if (!tasker) {
    console.log('No tasker provided')
    return null
  }
  if (!profile) {
    console.log('No profile found')
    return null
  }
  
  // Additional validation
  if (!createBooking || typeof createBooking !== 'function') {
    console.error('createBooking function is not available!')
    console.error('createBooking:', createBooking)
    console.error('typeof createBooking:', typeof createBooking)
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Error</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.content}>
            <Text>Error: Booking system not available. Please try again.</Text>
          </View>
        </View>
      </Modal>
    )
  }

  const handleBooking = async () => {
    if (!profile) {
      Alert.alert('Error', 'Please sign in to book a tasker')
      return
    }

    if (!serviceName || !agreedPrice || !bookingDate || !startTime) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    // Validate price
    const price = parseFloat(agreedPrice)
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price greater than 0')
      return
    }

    // Validate base price (hourly rate)
    if (tasker.hourly_rate === undefined || tasker.hourly_rate === null || isNaN(tasker.hourly_rate) || tasker.hourly_rate < 0) {
      Alert.alert('Error', 'Invalid hourly rate for this tasker')
      return
    }

    // Validate that agreed price is reasonable (only if hourly rate > 0)
    if (tasker.hourly_rate > 0 && price < tasker.hourly_rate) {
      Alert.alert('Error', `Agreed price ($${price}) cannot be less than the hourly rate ($${tasker.hourly_rate})`)
      return
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(bookingDate)) {
      Alert.alert('Error', 'Please enter date in YYYY-MM-DD format')
      return
    }

    // Validate that booking date is not in the past
    const selectedDate = new Date(bookingDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      Alert.alert('Error', 'Booking date cannot be in the past')
      return
    }

    setLoading(true)
    try {
      const finalBookingData = {
        customer_id: profile.id,
        technician_id: tasker.profile_id,
        service_name: serviceName.trim(),
        service_description: serviceDescription.trim() || undefined,
        base_price: Number(tasker.hourly_rate || 0),
        agreed_price: Number(agreedPrice),
        price_type: 'hourly' as const,
        booking_date: bookingDate,
        start_time: startTime,
        estimated_duration_hours: estimatedHours ? Number(estimatedHours) : undefined,
        city: tasker.city || undefined,
        state: tasker.state || undefined,
        customer_notes: customerNotes.trim() || undefined,
      }

      const data = await createBooking(finalBookingData)

      Alert.alert('Success', 'Booking request sent successfully!')
      onSuccess?.()
      onClose()
      
      // Reset form
      setServiceName('')
      setServiceDescription('')
      setAgreedPrice('')
      setBookingDate('')
      setStartTime('')
      setEstimatedHours('')
      setCustomerNotes('')
    } catch (error: any) {
      console.error('Booking error:', error)
      Alert.alert('Error', error.message || 'Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getMinDate = () => {
    const today = new Date()
    return formatDateForInput(today)
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
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Tasker</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tasker Profile Card */}
          <View style={styles.taskerCard}>
            <View style={styles.taskerHeader}>
              <Image 
                source={{ 
                  uri: tasker.avatar_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                }} 
                style={styles.avatar} 
              />
              <View style={styles.taskerInfo}>
                <Text style={styles.taskerName}>{tasker.full_name}</Text>
                <Text style={styles.taskerUsername}>@{tasker.username}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.rating}>{tasker.rating_average?.toFixed(1) || '0.0'}</Text>
                  <Text style={styles.reviews}>({tasker.rating_count || 0} reviews)</Text>
                </View>
                <Text style={styles.hourlyRate}>${tasker.hourly_rate || 0}/hr</Text>
              </View>
            </View>

            {tasker.bio && (
              <Text style={styles.bio}>{tasker.bio}</Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{tasker.total_tasks_completed || 0}</Text>
                <Text style={styles.statLabel}>Jobs Completed</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{tasker.experience_years || 'N/A'}</Text>
                <Text style={styles.statLabel}>Years Experience</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{tasker.response_time || 'N/A'}</Text>
                <Text style={styles.statLabel}>Response Time</Text>
              </View>
            </View>

            {tasker.skills && tasker.skills.length > 0 && (
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsTitle}>Skills:</Text>
                <View style={styles.skillsList}>
                  {tasker.skills.map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {tasker.certifications && tasker.certifications.length > 0 && (
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsTitle}>Certifications:</Text>
                <View style={styles.skillsList}>
                  {tasker.certifications.map((cert, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillText}>{cert}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.locationText}>
                {tasker.city && tasker.state ? `${tasker.city}, ${tasker.state}` : 'Location not specified'}
              </Text>
            </View>
          </View>

          {/* Booking Form */}
          <View style={styles.bookingForm}>
            <Text style={styles.formTitle}>Booking Details</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Service Name *</Text>
              <TextInput
                style={styles.input}
                value={serviceName}
                onChangeText={setServiceName}
                placeholder="e.g., House Cleaning, Plumbing Repair"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Service Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={serviceDescription}
                onChangeText={setServiceDescription}
                placeholder="Describe what you need..."
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Agreed Price ($) *</Text>
              <TextInput
                style={styles.input}
                value={agreedPrice}
                onChangeText={setAgreedPrice}
                placeholder={`Base rate: $${tasker.hourly_rate || 0}/hr`}
                keyboardType="numeric"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Booking Date *</Text>
              <TextInput
                style={styles.input}
                value={bookingDate}
                onChangeText={setBookingDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.text.tertiary}
              />
              <Text style={styles.helpText}>Enter date in YYYY-MM-DD format (e.g., 2025-01-15)</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Start Time *</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="e.g., 09:00 AM"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Estimated Hours</Text>
              <TextInput
                style={styles.input}
                value={estimatedHours}
                onChangeText={setEstimatedHours}
                placeholder="e.g., 2.5"
                keyboardType="numeric"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Special Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={customerNotes}
                onChangeText={setCustomerNotes}
                placeholder="Any special requirements or notes..."
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>
                     </View>

            {/* Book Button */}
            <TouchableOpacity
              style={[styles.bookButton, loading && styles.bookButtonDisabled]}
              onPress={handleBooking}
              disabled={loading}
            >
              <Text style={styles.bookButtonText}>
                {loading ? 'Sending Request...' : 'Send Booking Request'}
              </Text>
            </TouchableOpacity>
         </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  taskerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  taskerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  taskerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  taskerUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  hourlyRate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary[500],
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary[500],
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  skillText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  bookingForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  bookButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
