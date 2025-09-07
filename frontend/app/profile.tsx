import React, { useState, useEffect, useCallback } from 'react'
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
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import { useNotifications } from '../hooks/useNotifications'
import { ImageUploadService } from '../services/ImageUploadService'
import { useUserReviewStats } from '../hooks/useRatings'
import RatingDisplay from '../components/RatingDisplay'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import { useBookings } from '../hooks/useBookings'

import TaskerApplicationModal from '../components/TaskerApplicationModal'

const { width } = Dimensions.get('window')

export default function Profile() {
  const { profile, user, refreshProfile, signOut } = useAuth()
  const { t } = useLanguage()
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

  const checkTaskerApplication = useCallback(async () => {
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
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      checkTaskerApplication()
    }
  }, [user?.id, checkTaskerApplication])

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
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[Colors.primary[500], Colors.primary[600]]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={24} color={Colors.text.inverse} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerButton, editing && styles.headerButtonActive]} 
                onPress={() => setEditing(!editing)}
              >
                <Ionicons 
                  name={editing ? "close" : "create-outline"} 
                  size={24} 
                  color={Colors.text.inverse} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Modern Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
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
                  <Ionicons name="camera" size={18} color={Colors.text.inverse} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.full_name}</Text>
            <Text style={styles.profileUsername}>@{profile.username}</Text>
            
            <View style={styles.roleContainer}>
              <View style={[styles.roleBadge, isTasker && styles.roleBadgeTasker]}>
                <Ionicons 
                  name={isTasker ? "briefcase" : "person"} 
                  size={14} 
                  color={isTasker ? Colors.success[600] : Colors.primary[600]} 
                />
                <Text style={[styles.roleText, isTasker && styles.roleTextTasker]}>
                  {profile.role === 'customer' ? 'Customer' : 
                   profile.role === 'both' ? 'Customer & Tasker' : 'Tasker'}
                </Text>
              </View>

              {isTasker && (
                <View style={[styles.availabilityBadge, !available && styles.availabilityBadgeOffline]}>
                  <View style={[styles.availabilityDot, { backgroundColor: available ? Colors.success[500] : Colors.error[500] }]} />
                  <Text style={[styles.availabilityText, !available && styles.availabilityTextOffline]}>
                    {available ? 'Available' : 'Offline'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Modern Stats Section */}
        {isTasker && (
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success[500]} />
              </View>
              <Text style={styles.statValue}>{profile.completed_tasks || 0}</Text>
              <Text style={styles.statLabel}>Tasks Completed</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={24} color={Colors.warning[500]} />
              </View>
              <Text style={styles.statValue}>{profile.rating_average?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="chatbubble" size={24} color={Colors.primary[500]} />
              </View>
              <Text style={styles.statValue}>{profile.rating_count || 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        )}

        {/* Information Sections */}
        <View style={styles.sectionsContainer}>
          {/* Basic Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={Colors.primary[500]} />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Full Name</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.infoValue}>{profile.full_name}</Text>
                )}
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Username</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    autoCapitalize="none"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.infoValue}>@{profile.username}</Text>
                )}
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.infoValue}>{profile.phone || 'Not provided'}</Text>
                )}
              </View>

              <View style={[styles.infoItem, styles.infoItemFull]}>
                <Text style={styles.infoLabel}>Bio</Text>
                {editing ? (
                  <TextInput
                    style={[styles.infoInput, styles.infoTextArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself and your services..."
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.infoValue}>{profile.bio || 'No bio provided'}</Text>
                )}
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {new Date(profile.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={Colors.primary[500]} />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>City</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Enter your city"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.infoValue}>{profile.city || 'Not provided'}</Text>
                )}
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>State</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={state}
                    onChangeText={setState}
                    placeholder="Enter your state"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                ) : (
                  <Text style={styles.infoValue}>{profile.state || 'Not provided'}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Professional Information Section */}
          {isTasker && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="briefcase-outline" size={20} color={Colors.primary[500]} />
                <Text style={styles.sectionTitle}>Professional Information</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Hourly Rate</Text>
                  {editing ? (
                    <TextInput
                      style={styles.infoInput}
                      value={hourlyRate}
                      onChangeText={setHourlyRate}
                      placeholder="Enter your hourly rate"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.text.tertiary}
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      ${profile.hourly_rate || 'Not set'}/hr
                    </Text>
                  )}
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Experience</Text>
                  {editing ? (
                    <TextInput
                      style={styles.infoInput}
                      value={experienceYears}
                      onChangeText={setExperienceYears}
                      placeholder="Enter years of experience"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.text.tertiary}
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {profile.experience_years || 'Not specified'} years
                    </Text>
                  )}
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Response Time</Text>
                  {editing ? (
                    <TextInput
                      style={styles.infoInput}
                      value={responseTime}
                      onChangeText={setResponseTime}
                      placeholder="e.g., Within 1 hour"
                      placeholderTextColor={Colors.text.tertiary}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile.response_time || 'Not specified'}</Text>
                  )}
                </View>

                <View style={[styles.infoItem, styles.infoItemFull]}>
                  <Text style={styles.infoLabel}>Skills</Text>
                  {editing ? (
                    <TextInput
                      style={[styles.infoInput, styles.infoTextArea]}
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
                        <Text style={styles.infoValue}>No skills listed</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={[styles.infoItem, styles.infoItemFull]}>
                  <Text style={styles.infoLabel}>Certifications</Text>
                  {editing ? (
                    <TextInput
                      style={[styles.infoInput, styles.infoTextArea]}
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
                        <Text style={styles.infoValue}>No certifications listed</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={[styles.infoItem, styles.infoItemFull]}>
                  <Text style={styles.infoLabel}>Languages</Text>
                  {editing ? (
                    <TextInput
                      style={[styles.infoInput, styles.infoTextArea]}
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
                        <Text style={styles.infoValue}>No languages listed</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={[styles.infoItem, styles.infoItemFull]}>
                  <Text style={styles.infoLabel}>Available for Work</Text>
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
                      <Text style={[styles.infoValue, { color: available ? Colors.success[600] : Colors.error[600] }]}>
                        {available ? 'Available' : 'Not Available'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/jobs')}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="briefcase-outline" size={24} color={Colors.primary[500]} />
              </View>
              <Text style={styles.actionButtonText}>My Jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/chats')}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="chatbubble-outline" size={24} color={Colors.primary[500]} />
              </View>
              <Text style={styles.actionButtonText}>Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/settings')}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="settings-outline" size={24} color={Colors.primary[500]} />
              </View>
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="help-circle-outline" size={24} color={Colors.primary[500]} />
              </View>
              <Text style={styles.actionButtonText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tasker Application Section */}
        {profile?.role === 'customer' && (
          <View style={styles.taskerSection}>
            {taskerApplication ? (
              <View style={styles.applicationStatus}>
                <View style={styles.applicationStatusHeader}>
                  <Ionicons 
                    name={
                      taskerApplication.status === 'approved' ? 'checkmark-circle' :
                      taskerApplication.status === 'rejected' ? 'close-circle' :
                      'time'
                    } 
                    size={20} 
                    color={
                      taskerApplication.status === 'approved' ? Colors.success[500] :
                      taskerApplication.status === 'rejected' ? Colors.error[500] :
                      Colors.warning[500]
                    } 
                  />
                  <Text style={styles.applicationStatusTitle}>
                    Application: {taskerApplication.status.charAt(0).toUpperCase() + taskerApplication.status.slice(1)}
                  </Text>
                </View>
                
                {taskerApplication.status === 'rejected' && (
                  <TouchableOpacity 
                    style={styles.reapplyButton}
                    onPress={() => setIsTaskerApplicationModalVisible(true)}
                  >
                    <Ionicons name="refresh" size={16} color={Colors.text.inverse} />
                    <Text style={styles.reapplyButtonText}>Reapply</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.becomeTaskerButton}
                onPress={() => setIsTaskerApplicationModalVisible(true)}
              >
                <Ionicons name="briefcase-outline" size={20} color={Colors.text.inverse} />
                <Text style={styles.becomeTaskerButtonText}>Become a Tasker</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.bottomActions}>
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

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error[500]} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
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
  headerGradient: {
    paddingTop: Spacing.lg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  content: {
    flex: 1,
  },

  heroSection: {
    backgroundColor: Colors.background.primary,
    marginTop: -Spacing.xl,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.neutral[200],
    borderWidth: 4,
    borderColor: Colors.background.primary,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary[500],
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  profileUsername: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontWeight: Typography.fontWeight.medium,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleBadgeTasker: {
    backgroundColor: Colors.success[50],
  },
  roleText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[600],
    textTransform: 'capitalize',
    marginLeft: Spacing.xs,
  },
  roleTextTasker: {
    color: Colors.success[600],
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  availabilityBadgeOffline: {
    backgroundColor: Colors.error[50],
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  availabilityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success[600],
  },
  availabilityTextOffline: {
    color: Colors.error[600],
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statCard: {
    alignItems: 'center',
    width: '30%',
    paddingHorizontal: Spacing.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  sectionsContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.secondary,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  infoGrid: {
    padding: Spacing.lg,
  },
  infoItem: {
    marginBottom: Spacing.md,
  },
  infoItemFull: {
    width: '100%',
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  infoInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    backgroundColor: Colors.background.secondary,
    color: Colors.text.primary,
  },
  infoTextArea: {
    minHeight: 60,
    paddingTop: Spacing.sm,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  taskerSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  applicationStatus: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
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
  reapplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  reapplyButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  becomeTaskerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  becomeTaskerButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  bottomActions: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  skillChip: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[200],
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success[500],
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
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
})