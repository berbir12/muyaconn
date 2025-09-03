import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNotifications } from '../hooks/useNotifications'
import { ImageUploadService } from '../services/ImageUploadService'
import { useUserReviewStats } from '../hooks/useRatings'
import RatingDisplay from '../components/RatingDisplay'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import { useBookings } from '../hooks/useBookings'

import TaskerApplicationModal from '../components/TaskerApplicationModal'

export default function Profile() {
  const { profile, user, refreshProfile, signOut } = useAuth()
  const { bookings, loading: bookingsLoading, error: bookingsError } = useBookings()
  const { stats: reviewStats } = useUserReviewStats(user?.id || '')
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [city, setCity] = useState(profile?.city || '')
  const [state, setState] = useState(profile?.state || '')
  const [hourlyRate, setHourlyRate] = useState(profile?.hourly_rate?.toString() || '')
  const [experienceYears, setExperienceYears] = useState(profile?.experience_years?.toString() || '')
  const [responseTime, setResponseTime] = useState(profile?.response_time || 'Within 1 hour')
  const [available, setAvailable] = useState(profile?.available ?? true)
  const [skills, setSkills] = useState(profile?.skills?.join(', ') || '')
  const [certifications, setCertifications] = useState(profile?.certifications?.join(', ') || '')
  const [languages, setLanguages] = useState(profile?.languages?.join(', ') || '')
  const [loading, setLoading] = useState(false)
  const [isTaskerApplicationModalVisible, setIsTaskerApplicationModalVisible] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [taskerApplication, setTaskerApplication] = useState<any>(null)

  // Clear avatarUri when profile changes (user switches)
  useEffect(() => {
    setAvatarUri(null)
  }, [profile?.id])

  useEffect(() => {
    if (profile) {
      setUsername(profile.username)
      setFullName(profile.full_name)
      setBio(profile.bio || '')
      setPhone(profile.phone || '')
      setCity(profile.city || '')
      setState(profile.state || '')
      setHourlyRate(profile.hourly_rate?.toString() || '')
      setExperienceYears(profile.experience_years?.toString() || '')
      setResponseTime(profile.response_time || 'Within 1 hour')
      setAvailable(profile.available ?? true)
      setSkills(profile.skills?.join(', ') || '')
      setCertifications(profile.certifications?.join(', ') || '')
      setLanguages(profile.languages?.join(', ') || '')
    }
  }, [profile])

  useEffect(() => {
    if (user?.id) {
      checkTaskerApplication()
    }
  }, [user?.id])

  const checkTaskerApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('tasker_applications')
        .select('id, status, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking tasker application:', error)
        return
      }

      setTaskerApplication(data)
    } catch (error) {
      console.error('Error checking tasker application:', error)
    }
  }

  const handleSave = async () => {
    if (!username || !fullName || !user) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const updateData: any = {
        username: username.trim(),
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        available,
        updated_at: new Date().toISOString(),
      }

      // Add tasker-specific fields if user is a tasker
      if (profile?.role === 'tasker' || profile?.role === 'both') {
        updateData.hourly_rate = hourlyRate ? parseFloat(hourlyRate) : null
        updateData.experience_years = experienceYears ? parseInt(experienceYears) : null
        updateData.response_time = responseTime.trim() || null
        updateData.skills = skills.trim() ? skills.split(',').map(s => s.trim()).filter(s => s) : []
        updateData.certifications = certifications.trim() ? certifications.split(',').map(s => s.trim()).filter(s => s) : []
        updateData.languages = languages.trim() ? languages.split(',').map(s => s.trim()).filter(s => s) : []
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      setEditing(false)
      Alert.alert('Success', 'Profile updated successfully')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning[200]
      case 'confirmed': return Colors.primary[200]
      case 'in_progress': return Colors.primary[200]
      case 'completed': return Colors.success[200]
      case 'cancelled': return Colors.error[200]
      default: return Colors.neutral[200]
    }
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/auth')
          }
        },
      ]
    )
  }

  const handleBecomeTasker = () => {
    // This function is no longer needed since we directly open the modal
    // But keeping it for potential future use
  }

  const handleChangeAvatar = async () => {
    if (!user) {
      Alert.alert('Error', 'User not logged in.')
      return
    }

    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.')
        return
      }

      // Show action sheet for camera or gallery
      Alert.alert(
        'Change Profile Photo',
        'Choose how you want to update your profile photo',
        [
          {
            text: 'Take Photo',
            onPress: () => takeAvatarPhoto()
          },
          {
            text: 'Choose from Gallery',
            onPress: () => pickAvatarFromGallery()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      )
    } catch (error: any) {
      console.error('Error changing avatar:', error)
      Alert.alert('Error', 'Failed to change profile photo. Please try again.')
    }
  }

  const takeAvatarPhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        setAvatarUri(imageUri)
        
        // Update profile with new avatar
        await updateProfileAvatar(imageUri)
        Alert.alert('Success', 'Profile photo updated successfully!')
      }
    } catch (error: any) {
      console.error('Error taking avatar photo:', error)
      Alert.alert('Error', 'Failed to take photo. Please try again.')
    }
  }

  const pickAvatarFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        setAvatarUri(imageUri)
        
        // Update profile with new avatar
        await updateProfileAvatar(imageUri)
        Alert.alert('Success', 'Profile photo updated successfully!')
      }
    } catch (error: any) {
      console.error('Error picking avatar image:', error)
      Alert.alert('Error', 'Failed to select image. Please try again.')
    }
  }

  const updateProfileAvatar = async (imageUri: string) => {
    try {
      setLoading(true)
      
      // Upload image to Supabase Storage
      const publicUrl = await ImageUploadService.uploadImage(
        imageUri, 
        'user-avatars', 
        'profiles', 
        `avatar_${user?.id}_${Date.now()}`
      )
      
      // Update profile with the public URL
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      await refreshProfile()
      // Clear the local avatarUri since we now have the URL in the profile
      setAvatarUri(null)
    } catch (error: any) {
      console.error('Error updating profile avatar:', error)
      Alert.alert('Error', 'Failed to update profile photo. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const isTasker = profile.role === 'tasker' || profile.role === 'both'

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={[styles.editButton, editing && styles.editButtonActive]} 
            onPress={() => setEditing(!editing)}
          >
            <Ionicons 
              name={editing ? "close" : "create-outline"} 
              size={20} 
              color={editing ? Colors.text.inverse : Colors.primary[500]} 
            />
            <Text style={[styles.editButtonText, editing && styles.editButtonTextActive]}>
              {editing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Profile Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: avatarUri || profile.avatar_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
              }} 
              style={styles.avatar}
              key={`avatar-${profile?.id}`}
            />
            {editing && (
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={handleChangeAvatar}
                disabled={loading}
              >
                <Ionicons name="camera" size={20} color={Colors.text.inverse} />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.profileName}>{profile.full_name}</Text>
          <Text style={styles.profileUsername}>@{profile.username}</Text>
          
          <View style={styles.roleBadge}>
            <Ionicons 
              name={isTasker ? "briefcase" : "person"} 
              size={16} 
              color={Colors.primary[500]} 
            />
            <Text style={styles.roleText}>
              {profile.role === 'customer' ? 'Customer' : 
               profile.role === 'both' ? 'Customer & Service Provider' : 'Service Provider'}
            </Text>
          </View>

          {isTasker && (
            <View style={styles.availabilityBadge}>
              <View style={[styles.availabilityDot, { backgroundColor: available ? Colors.success[500] : Colors.error[500] }]} />
              <Text style={styles.availabilityText}>
                {available ? 'Available for Work' : 'Not Available'}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        {isTasker && (
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.completed_tasks || 0}</Text>
              <Text style={styles.statLabel}>Jobs Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.rating_average?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name="star" 
                    size={12} 
                    color={star <= (profile.rating_average || 0) ? Colors.warning[500] : Colors.neutral[300]} 
                  />
                ))}
              </View>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.rating_count || 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        )}

        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={24} color={Colors.primary[500]} />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.full_name}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Username *</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    autoCapitalize="none"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>@{profile.username}</Text>
                )}
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{user?.email}</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.text.tertiary}
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.phone || 'Not provided'}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Bio</Text>
              {editing ? (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself and your services..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.text.tertiary}
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.bio || 'No bio provided'}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Member Since</Text>
              <Text style={styles.fieldValue}>
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={24} color={Colors.primary[500]} />
            <Text style={styles.cardTitle}>Location</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>City</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Enter your city"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.city || 'Not provided'}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>State</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={state}
                    onChangeText={setState}
                    placeholder="Enter your state"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.state || 'Not provided'}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Professional Information Card */}
        {isTasker && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="briefcase-outline" size={24} color={Colors.primary[500]} />
              <Text style={styles.cardTitle}>Professional Information</Text>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Hourly Rate ($)</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={hourlyRate}
                      onChangeText={setHourlyRate}
                      placeholder="Enter your hourly rate"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.text.tertiary}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>
                      ${profile.hourly_rate || 'Not set'}/hr
                    </Text>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Years of Experience</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={experienceYears}
                      onChangeText={setExperienceYears}
                      placeholder="Enter years of experience"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.text.tertiary}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>
                      {profile.experience_years || 'Not specified'} years
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Response Time</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={responseTime}
                    onChangeText={setResponseTime}
                    placeholder="e.g., Within 1 hour"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.response_time || 'Not specified'}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Skills</Text>
                {editing ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={skills}
                    onChangeText={setSkills}
                    placeholder="e.g., Plumbing, Electrical, Carpentry"
                    multiline
                    numberOfLines={2}
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <View style={styles.skillsContainer}>
                    {profile.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill, index) => (
                        <View key={index} style={styles.skillChip}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.fieldValue}>No skills listed</Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Certifications</Text>
                {editing ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={certifications}
                    onChangeText={setCertifications}
                    placeholder="e.g., Licensed Plumber, OSHA Certified"
                    multiline
                    numberOfLines={2}
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <View style={styles.skillsContainer}>
                    {profile.certifications && profile.certifications.length > 0 ? (
                      profile.certifications.map((cert, index) => (
                        <View key={index} style={styles.skillChip}>
                          <Text style={styles.skillText}>{cert}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.fieldValue}>No certifications listed</Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Languages</Text>
                {editing ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={languages}
                    onChangeText={setLanguages}
                    placeholder="e.g., English, Spanish"
                    multiline
                    numberOfLines={2}
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <View style={styles.skillsContainer}>
                    {profile.languages && profile.languages.length > 0 ? (
                      profile.languages.map((lang, index) => (
                        <View key={index} style={styles.skillChip}>
                          <Text style={styles.skillText}>{lang}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.fieldValue}>No languages listed</Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Available for Work</Text>
                {editing ? (
                  <View style={styles.switchContainer}>
                    <Switch
                      value={available}
                      onValueChange={setAvailable}
                      trackColor={{ false: Colors.neutral[300], true: Colors.primary[200] }}
                      thumbColor={available ? Colors.primary[500] : Colors.neutral[400]}
                    />
                    <Text style={styles.switchLabel}>
                      {available ? 'Available' : 'Not Available'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.availabilityStatus}>
                    <View style={[styles.availabilityDot, { backgroundColor: available ? Colors.success[500] : Colors.error[500] }]} />
                    <Text style={[styles.fieldValue, { color: available ? Colors.success[600] : Colors.error[600] }]}>
                      {available ? 'Available' : 'Not Available'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* My Bookings Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={24} color={Colors.primary[500]} />
            <Text style={styles.cardTitle}>My Bookings</Text>
          </View>
          
          <View style={styles.cardContent}>
            {bookingsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading bookings...</Text>
              </View>
            ) : bookingsError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error loading bookings: {bookingsError}</Text>
              </View>
            ) : bookings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color={Colors.neutral[300]} />
                <Text style={styles.emptyText}>No bookings yet</Text>
                <Text style={styles.emptySubtext}>Your upcoming and past bookings will appear here</Text>
              </View>
            ) : (
              <View style={styles.bookingsList}>
                {bookings.slice(0, 3).map((booking) => (
                  <View key={booking.id} style={styles.bookingItem}>
                    <View style={styles.bookingHeader}>
                      <Text style={styles.bookingService}>{booking.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                        <Text style={styles.statusText}>{booking.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.bookingDate}>
                      {booking.task_date 
                        ? new Date(booking.task_date).toLocaleDateString()
                        : 'Flexible date'
                      }
                      {booking.task_time && ` at ${booking.task_time}`}
                    </Text>
                    <Text style={styles.bookingPrice}>
                      {booking.budget 
                        ? `$${booking.budget}`
                        : booking.final_price 
                          ? `$${booking.final_price}`
                          : 'Price TBD'
                      }
                    </Text>
                    <Text style={styles.bookingPerson}>
                      {profile?.id === booking.customer_id ? 'with' : 'for'} {
                        profile?.id === booking.customer_id 
                          ? booking.tasker_profile?.full_name 
                          : booking.customer_profile?.full_name
                      }
                    </Text>
                  </View>
                ))}
                {bookings.length > 3 && (
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => router.push('/jobs')}
                  >
                    <Text style={styles.viewAllText}>View All {bookings.length} Tasks</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary[500]} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={24} color={Colors.primary[500]} />
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>
          
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="notifications-outline" size={24} color={Colors.primary[500]} />
            <Text style={styles.actionText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="shield-outline" size={24} color={Colors.primary[500]} />
            <Text style={styles.actionText}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="help-circle-outline" size={24} color={Colors.primary[500]} />
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
          </TouchableOpacity>
        </View>

        {/* Become a Tasker Card - Only show for clients */}
        {profile?.role === 'customer' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="briefcase-outline" size={24} color={Colors.primary[500]} />
              <Text style={styles.cardTitle}>Become a Tasker</Text>
            </View>
            
            {taskerApplication ? (
              <View style={styles.applicationStatusContainer}>
                <View style={styles.applicationStatusHeader}>
                  <Ionicons 
                    name={
                      taskerApplication.status === 'approved' ? 'checkmark-circle' :
                      taskerApplication.status === 'rejected' ? 'close-circle' :
                      'time'
                    } 
                    size={24} 
                    color={
                      taskerApplication.status === 'approved' ? Colors.success[500] :
                      taskerApplication.status === 'rejected' ? Colors.error[500] :
                      Colors.warning[500]
                    } 
                  />
                  <Text style={styles.applicationStatusTitle}>
                    Application Status: {taskerApplication.status.charAt(0).toUpperCase() + taskerApplication.status.slice(1)}
                  </Text>
                </View>
                
                <Text style={styles.applicationStatusText}>
                  {taskerApplication.status === 'pending' && 'Your application is under review. We will notify you once it is processed.'}
                  {taskerApplication.status === 'approved' && 'Congratulations! Your application has been approved. You can now accept tasks.'}
                  {taskerApplication.status === 'rejected' && 'Your application was not approved. You can reapply after addressing the feedback below.'}
                </Text>
                
                {taskerApplication.status === 'rejected' && (
                  <View style={styles.rejectionReasonContainer}>
                    <Text style={styles.rejectionReasonTitle}>Rejection Reason:</Text>
                    <Text style={styles.rejectionReasonText}>
                      Your application was not approved. Please contact support for more details or reapply with improved information.
                    </Text>
                  </View>
                )}
                
                <Text style={styles.applicationDate}>
                  Applied on: {new Date(taskerApplication.created_at).toLocaleDateString()}
                </Text>
                
                {taskerApplication.status === 'rejected' && (
                  <TouchableOpacity 
                    style={styles.reapplyButton}
                    onPress={() => setIsTaskerApplicationModalVisible(true)}
                  >
                    <Ionicons name="refresh" size={20} color={Colors.text.inverse} />
                    <Text style={styles.reapplyButtonText}>Reapply Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                <Text style={styles.becomeTaskerText}>
                  Want to earn money by helping others? Apply to become a verified tasker and start accepting tasks.
                </Text>
                
                <TouchableOpacity 
                  style={styles.becomeTaskerButton}
                  onPress={() => setIsTaskerApplicationModalVisible(true)}
                >
                  <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} />
                  <Text style={styles.becomeTaskerButtonText}>Apply Now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Tasker Status Card - Only show for taskers */}
        {profile?.role === 'tasker' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success[500]} />
              <Text style={styles.cardTitle}>Tasker Status</Text>
            </View>
            
            <Text style={styles.taskerStatusText}>
              You are a verified tasker! You can now accept tasks and earn money.
            </Text>
            
            <View style={styles.taskerStats}>
              <View style={styles.taskerStat}>
                <Text style={styles.taskerStatNumber}>{profile?.completed_tasks || 0}</Text>
                <Text style={styles.taskerStatLabel}>Tasks Completed</Text>
              </View>
              <View style={styles.taskerStat}>
                <Text style={styles.taskerStatNumber}>{reviewStats?.total_reviews || 0}</Text>
                <Text style={styles.taskerStatLabel}>Reviews</Text>
              </View>
              <View style={styles.taskerStat}>
                <Text style={styles.taskerStatNumber}>0</Text>
                <Text style={styles.taskerStatLabel}>Earnings</Text>
              </View>
            </View>
          </View>
        )}

        {/* Rating Display - Show for taskers and users with reviews */}
        {(profile?.role === 'tasker' || profile?.role === 'both') && reviewStats && reviewStats.total_reviews > 0 && (
          <RatingDisplay
            stats={reviewStats}
            showDetails={false}
            style={styles.ratingCard}
          />
        )}

        {/* Save Button (when editing) */}
        {editing && (
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Ionicons name="checkmark" size={20} color={Colors.text.inverse} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={Colors.error[500]} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

             <TaskerApplicationModal
         visible={isTaskerApplicationModalVisible}
         onClose={() => setIsTaskerApplicationModalVisible(false)}
         onApplicationSubmitted={() => {
           setIsTaskerApplicationModalVisible(false)
           checkTaskerApplication() // Refresh application status
           Alert.alert(
             'Application Submitted! 🎉',
             'Your tasker application has been submitted successfully. You will be notified once it is reviewed.',
             [{ text: 'OK' }]
           )
         }}
       />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  editButtonActive: {
    backgroundColor: Colors.error[500],
    borderColor: Colors.error[500],
  },
  editButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[700],
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  editButtonTextActive: {
    color: Colors.text.inverse,
  },
  content: {
    flex: 1,
  },

  heroSection: {
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.neutral[200],
    borderWidth: 4,
    borderColor: Colors.primary[100],
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary[500],
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  profileUsername: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontWeight: Typography.fontWeight.medium,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[600],
    textTransform: 'capitalize',
    marginLeft: Spacing.xs,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  availabilityText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success[600],
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statCard: {
    alignItems: 'center',
    width: '30%',
    paddingHorizontal: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[500],
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.secondary,
  },
  cardContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    gap: Spacing.md,
  },
  fieldContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  fieldValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    backgroundColor: Colors.background.secondary,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.sm,
    textAlignVertical: 'top',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  skillChip: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    marginBottom: Spacing.xs,
  },
  skillText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.medium,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  switchLabel: {
    marginLeft: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  availabilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  actionText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
    fontWeight: Typography.fontWeight.medium,
    paddingVertical: Spacing.xs,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success[500],
    margin: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error[500],
    gap: Spacing.sm,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    color: Colors.error[500],
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Booking styles
  errorContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error[500],
    textAlign: 'center',
  },
  emptyContainer: {
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.neutral[500],
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
  bookingsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  bookingItem: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bookingService: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  bookingDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  bookingPrice: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[500],
    marginBottom: Spacing.xs,
  },
  bookingPerson: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginTop: Spacing.md,
  },
  viewAllText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[500],
    marginRight: Spacing.sm,
  },
  // New styles for Become a Tasker and Tasker Status
  ratingCard: {
    marginTop: Spacing.md,
  },
  becomeTaskerText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    lineHeight: 22,
  },
  becomeTaskerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  becomeTaskerButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  taskerStatusText: {
    fontSize: Typography.fontSize.md,
    color: Colors.success[600],
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    lineHeight: 22,
  },
  taskerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  taskerStat: {
    alignItems: 'center',
  },
  taskerStatNumber: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[500],
  },
  taskerStatLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  // Application status styles
  applicationStatusContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  applicationStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  applicationStatusTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  applicationStatusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  applicationDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  rejectionReasonContainer: {
    backgroundColor: Colors.error[50],
    borderWidth: 1,
    borderColor: Colors.error[200],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  rejectionReasonTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.error[700],
    marginBottom: Spacing.xs,
  },
  rejectionReasonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error[600],
    lineHeight: 18,
  },
  reapplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  reapplyButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
})