import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ImageUploadService } from '../services/ImageUploadService'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface TaskerApplicationModalProps {
  visible: boolean
  onClose: () => void
  onApplicationSubmitted?: () => void
}

export default function TaskerApplicationModal({
  visible,
  onClose,
  onApplicationSubmitted,
}: TaskerApplicationModalProps) {
  const { profile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Personal Information
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [nationality, setNationality] = useState('')
  const [idNumber, setIdNumber] = useState('')
  
  // Professional Information
  const [experience, setExperience] = useState('')
  const [skills, setSkills] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [availability, setAvailability] = useState('')
  const [preferredCategories, setPreferredCategories] = useState('')
  
  // Documents & Verification
  const [hasValidId, setHasValidId] = useState(false)
  const [hasBackgroundCheck, setHasBackgroundCheck] = useState(false)
  const [hasInsurance, setHasInsurance] = useState(false)
  const [hasReferences, setHasReferences] = useState(false)
  const [nationalIdFront, setNationalIdFront] = useState<string | null>(null)
  const [nationalIdBack, setNationalIdBack] = useState<string | null>(null)
  const [skillCertifications, setSkillCertifications] = useState<string[]>([])
  
  // Additional Information
  const [bio, setBio] = useState('')
  const [whyTasker, setWhyTasker] = useState('')
  const [agreement, setAgreement] = useState(false)

  const totalSteps = 3

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!fullName || !phone || !dateOfBirth || !nationality || !idNumber) {
          Alert.alert('Missing Information', 'Please fill in all personal information fields.')
          return false
        }
        break
      case 2:
        if (!experience || !skills || !hourlyRate || !availability || !preferredCategories) {
          Alert.alert('Missing Information', 'Please fill in all professional information fields.')
          return false
        }
        break
      case 3:
        if (!nationalIdFront || !nationalIdBack || !agreement) {
          Alert.alert('Missing Information', 'Please upload both front and back of your National ID and agree to the terms.')
          return false
        }
        break
    }
    return true
  }

  const handleUploadDocument = async (side: 'front' | 'back') => {
    if (profile?.id) {
      setLoading(true)
      try {
        // Request camera permissions
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos of your ID.')
          setLoading(false)
          return
        }

        // Show action sheet for camera or gallery
        Alert.alert(
          `Upload ${side === 'front' ? 'Front' : 'Back'} of ID`,
          'Choose how you want to upload your ID',
          [
            {
              text: 'Take Photo',
              onPress: () => takePhoto(side)
            },
            {
              text: 'Choose from Gallery',
              onPress: () => pickFromGallery(side)
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        )
      } catch (error: any) {
        console.error('Error uploading document:', error)
        Alert.alert('Error', 'Failed to upload document. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      Alert.alert('Error', 'User not logged in.')
    }
  }

  const takePhoto = async (side: 'front' | 'back') => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        
        // Upload image to Supabase Storage
        setLoading(true)
        try {
          const publicUrl = await ImageUploadService.uploadImage(
            imageUri, 
            'tasker-documents', 
            'applications', 
            `national_id_${side}_${Date.now()}`
          )
          
          if (side === 'front') {
            setNationalIdFront(publicUrl)
          } else {
            setNationalIdBack(publicUrl)
          }
          
          Alert.alert('Success', `${side === 'front' ? 'Front' : 'Back'} ID photo uploaded successfully!`)
        } catch (uploadError: any) {
          console.error('Error uploading photo:', uploadError)
          Alert.alert('Upload Error', 'Photo captured but failed to upload. Please try again.')
        } finally {
          setLoading(false)
        }
      }
    } catch (error: any) {
      console.error('Error taking photo:', error)
      Alert.alert('Error', 'Failed to take photo. Please try again.')
    }
  }

  const pickFromGallery = async (side: 'front' | 'back') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        
        // Upload image to Supabase Storage
        setLoading(true)
        try {
          const publicUrl = await ImageUploadService.uploadImage(
            imageUri, 
            'tasker-documents', 
            'applications', 
            `national_id_${side}_${Date.now()}`
          )
          
          if (side === 'front') {
            setNationalIdFront(publicUrl)
          } else {
            setNationalIdBack(publicUrl)
          }
          
          Alert.alert('Success', `${side === 'front' ? 'Front' : 'Back'} ID photo uploaded successfully!`)
        } catch (uploadError: any) {
          console.error('Error uploading photo:', uploadError)
          Alert.alert('Upload Error', 'Photo selected but failed to upload. Please try again.')
        } finally {
          setLoading(false)
        }
      }
    } catch (error: any) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to select image. Please try again.')
    }
  }

  const handleUploadCertifications = async () => {
    if (profile?.id) {
      setLoading(true)
      try {
        // Request media library permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Media library permission is required to select certification images.')
          setLoading(false)
          return
        }

        // Show action sheet for camera or gallery
        Alert.alert(
          'Upload Certification',
          'Choose how you want to upload your certification',
          [
            {
              text: 'Take Photo',
              onPress: () => takeCertificationPhoto()
            },
            {
              text: 'Choose from Gallery',
              onPress: () => pickCertificationFromGallery()
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        )
      } catch (error: any) {
        console.error('Error uploading certifications:', error)
        Alert.alert('Error', 'Failed to upload certifications. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      Alert.alert('Error', 'User not logged in.')
    }
  }

  const takeCertificationPhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        
        // Upload image to Supabase Storage
        setLoading(true)
        try {
          const publicUrl = await ImageUploadService.uploadImage(
            imageUri, 
            'tasker-documents', 
            'applications', 
            `certification_${Date.now()}`
          )
          
          setSkillCertifications([...skillCertifications, publicUrl])
          Alert.alert('Success', 'Certification photo uploaded successfully!')
        } catch (uploadError: any) {
          console.error('Error uploading certification photo:', uploadError)
          Alert.alert('Upload Error', 'Photo captured but failed to upload. Please try again.')
        } finally {
          setLoading(false)
        }
      }
    } catch (error: any) {
      console.error('Error taking certification photo:', error)
      Alert.alert('Error', 'Failed to take photo. Please try again.')
    }
  }

  const pickCertificationFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        
        // Upload image to Supabase Storage
        setLoading(true)
        try {
          const publicUrl = await ImageUploadService.uploadImage(
            imageUri, 
            'tasker-documents', 
            'applications', 
            `certification_${Date.now()}`
          )
          
          setSkillCertifications([...skillCertifications, publicUrl])
          Alert.alert('Success', 'Certification image uploaded successfully!')
        } catch (uploadError: any) {
          console.error('Error uploading certification image:', uploadError)
          Alert.alert('Upload Error', 'Image selected but failed to upload. Please try again.')
        } finally {
          setLoading(false)
        }
      }
    } catch (error: any) {
      console.error('Error picking certification image:', error)
      Alert.alert('Error', 'Failed to select image. Please try again.')
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const submitApplication = async () => {
    if (!validateStep(currentStep)) return

    try {
      setLoading(true)

      // Check if user already has an application
      const { data: existingApplication, error: checkError } = await supabase
        .from('tasker_applications')
        .select('id, status')
        .eq('user_id', profile?.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if no application exists
        console.error('Error checking existing application:', checkError)
        throw checkError
      }

      if (existingApplication && existingApplication.status !== 'rejected') {
        Alert.alert(
          'Application Already Exists',
          `You already have a tasker application with status: ${existingApplication.status}. You cannot submit multiple applications.`,
          [{ text: 'OK' }]
        )
        return
      }

      // If user has a rejected application, allow them to reapply
      if (existingApplication && existingApplication.status === 'rejected') {
        Alert.alert(
          'Previous Application Rejected',
          'Your previous application was rejected. You can submit a new application to try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => submitNewApplication() }
          ]
        )
        return
      }

      // If no existing application or it's rejected, proceed with submission
      await submitNewApplication()
    } catch (error: any) {
      console.error('Error submitting application:', error)
      Alert.alert('Error', `Failed to submit application: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const submitNewApplication = async () => {
    try {

      // Simplified insert for testing
      const { data, error: applicationError } = await supabase
        .from('tasker_applications')
        .insert({
          user_id: profile?.id,
          status: 'pending',
          personal_info: {
            full_name: fullName,
            phone: phone,
            date_of_birth: dateOfBirth,
            nationality: nationality,
            id_number: idNumber,
          },
          professional_info: {
            experience: experience,
            skills: skills,
            hourly_rate: parseFloat(hourlyRate) || 0,
            availability: availability,
            preferred_categories: preferredCategories ? preferredCategories.split(',').map(cat => cat.trim()) : [],
          },
          verification: {
            has_valid_id: hasValidId,
            has_background_check: hasBackgroundCheck,
            has_insurance: hasInsurance,
            has_references: hasReferences,
            national_id_front: nationalIdFront,
            national_id_back: nationalIdBack,
            skill_certifications: skillCertifications,
          },
        })
        .select()

      if (applicationError) {
        console.error('Supabase error details:', applicationError)
        
        // Handle duplicate key error specifically
        if (applicationError.code === '23505') {
          Alert.alert(
            'Application Already Exists',
            'You already have a tasker application. Please check your application status in your profile.',
            [{ text: 'OK' }]
          )
          return
        }
        
        throw applicationError
      }

      console.log('Application submitted successfully:', data)

      // Send notification to admins about new tasker application
      try {
        const applicantName = fullName || 'A new applicant'
        
        // Get all admin users (you might want to adjust this query based on your admin system)
        const { data: adminUsers, error: adminError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(10) // Limit to prevent too many notifications

        if (!adminError && adminUsers && adminUsers.length > 0) {
          const { NotificationService } = await import('../services/NotificationService')
          
          // Send notification to each admin
          for (const admin of adminUsers) {
            await NotificationService.notifyAdminNewTaskerApplication(
              admin.id,
              applicantName
            )
          }
          console.log('Admin notifications sent for new tasker application')
        }
      } catch (notificationError) {
        console.error('Failed to send admin notification:', notificationError)
        // Don't fail the application submission if notification fails
      }

      Alert.alert(
        'Application Submitted! 🎉',
        'Your tasker application has been submitted successfully. Our team will review your application and get back to you within 2-3 business days. You will receive an email notification once your application is reviewed.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose()
              onApplicationSubmitted?.()
            }
          }
        ]
      )

    } catch (error: any) {
      console.error('Error submitting application:', error)
      Alert.alert('Error', `Failed to submit application: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View key={index} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep > index + 1 ? styles.stepCompleted :
            currentStep === index + 1 ? styles.stepActive :
            styles.stepPending
          ]}>
            {currentStep > index + 1 ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : (
              <Text style={styles.stepNumber}>{index + 1}</Text>
            )}
          </View>
                     <Text style={[
             styles.stepLabel,
             currentStep === index + 1 && styles.stepLabelActive
           ]}>
             {['Personal', 'Professional', 'Verification'][index]}
           </Text>
        </View>
      ))}
    </View>
  )

  const renderPersonalInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Please provide your basic personal information for verification purposes.
      </Text>
      
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full legal name"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+251 9XX XXX XXX"
          keyboardType="phone-pad"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Date of Birth *</Text>
        <TextInput
          style={styles.input}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Nationality *</Text>
        <TextInput
          style={styles.input}
          value={nationality}
          onChangeText={setNationality}
          placeholder="e.g., Ethiopian"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>ID Number *</Text>
        <TextInput
          style={styles.input}
          value={idNumber}
          onChangeText={setIdNumber}
          placeholder="Enter your government ID number"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>
    </View>
  )

  const renderProfessionalInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Professional Information</Text>
      <Text style={styles.stepDescription}>
        Tell us about your skills, experience, and what you can offer as a tasker.
      </Text>
      
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Years of Experience *</Text>
        <TextInput
          style={styles.input}
          value={experience}
          onChangeText={setExperience}
          placeholder="e.g., 3 years in plumbing"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Skills & Expertise *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={skills}
          onChangeText={setSkills}
          placeholder="List your key skills, certifications, and areas of expertise..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Hourly Rate (ETB) *</Text>
        <TextInput
          style={styles.input}
          value={hourlyRate}
          onChangeText={setHourlyRate}
          placeholder="e.g., 150"
          keyboardType="numeric"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Availability *</Text>
        <TextInput
          style={styles.input}
          value={availability}
          onChangeText={setAvailability}
          placeholder="e.g., Weekdays 9AM-6PM, Weekends flexible"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Preferred Task Categories *</Text>
        <TextInput
          style={styles.input}
          value={preferredCategories}
          onChangeText={setPreferredCategories}
          placeholder="e.g., Cleaning, Plumbing, Gardening, Moving"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>
    </View>
  )

  const renderVerification = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Verification & Documents</Text>
      <Text style={styles.stepDescription}>
        Please upload your National ID and any skill certifications for verification purposes.
      </Text>
      
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>National ID - Front Side *</Text>
        <TouchableOpacity
          style={[styles.uploadButton, nationalIdFront && styles.uploadButtonSuccess]}
          onPress={() => handleUploadDocument('front')}
        >
          <Ionicons 
            name={nationalIdFront ? "checkmark-circle" : "camera"} 
            size={24} 
            color={nationalIdFront ? Colors.success[500] : Colors.text.secondary} 
          />
          <Text style={[styles.uploadButtonText, nationalIdFront && styles.uploadButtonTextSuccess]}>
            {nationalIdFront ? 'Front ID Uploaded' : 'Upload Front of ID'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>National ID - Back Side *</Text>
        <TouchableOpacity
          style={[styles.uploadButton, nationalIdBack && styles.uploadButtonSuccess]}
          onPress={() => handleUploadDocument('back')}
        >
          <Ionicons 
            name={nationalIdBack ? "checkmark-circle" : "camera"} 
            size={24} 
            color={nationalIdBack ? Colors.success[500] : Colors.text.secondary} 
          />
          <Text style={[styles.uploadButtonText, nationalIdBack && styles.uploadButtonTextSuccess]}>
            {nationalIdBack ? 'Back ID Uploaded' : 'Upload Back of ID'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Skill Certifications (Optional)</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => handleUploadCertifications()}
        >
          <Ionicons name="document" size={24} color={Colors.text.secondary} />
          <Text style={styles.uploadButtonText}>
            Upload Skill Certifications
          </Text>
        </TouchableOpacity>
        {skillCertifications.length > 0 && (
          <Text style={styles.uploadCount}>
            {skillCertifications.length} certification(s) uploaded
          </Text>
        )}
      </View>

      <View style={styles.switchField}>
        <Text style={styles.switchLabel}>I agree to undergo a background check *</Text>
        <Switch
          value={hasBackgroundCheck}
          onValueChange={setHasBackgroundCheck}
          trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
          thumbColor={hasBackgroundCheck ? Colors.primary[600] : Colors.neutral[400]}
        />
      </View>

      <View style={styles.switchField}>
        <Text style={styles.switchLabel}>I have liability insurance (optional)</Text>
        <Switch
          value={hasInsurance}
          onValueChange={setHasInsurance}
          trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
          thumbColor={hasInsurance ? Colors.primary[600] : Colors.neutral[400]}
        />
      </View>

      <View style={styles.switchField}>
        <Text style={styles.switchLabel}>I can provide professional references (optional)</Text>
        <Switch
          value={hasReferences}
          onValueChange={setHasReferences}
          trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
          thumbColor={hasReferences ? Colors.primary[600] : Colors.neutral[400]}
        />
      </View>

      <View style={styles.switchField}>
        <Text style={styles.switchLabel}>
          I agree to the terms and conditions and privacy policy *
        </Text>
        <Switch
          value={agreement}
          onValueChange={setAgreement}
          trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
          thumbColor={agreement ? Colors.primary[600] : Colors.neutral[400]}
        />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={Colors.primary[500]} />
        <Text style={styles.infoText}>
          Your National ID will be used for identity verification. Skill certifications help showcase your expertise. All documents are securely stored and only used for verification purposes.
        </Text>
      </View>
    </View>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderPersonalInfo()
      case 2: return renderProfessionalInfo()
      case 3: return renderVerification()
      default: return null
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Become a Tasker</Text>
            <Text style={styles.headerSubtitle}>Application Form</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {renderStepContent()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.navButton} onPress={prevStep}>
              <Ionicons name="arrow-back" size={20} color={Colors.primary[500]} />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.navSpacer} />
          
          {currentStep < totalSteps ? (
            <TouchableOpacity style={styles.navButton} onPress={nextStep}>
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.primary[500]} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={submitApplication}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  stepPending: {
    backgroundColor: Colors.neutral[300],
  },
  stepActive: {
    backgroundColor: Colors.primary[500],
  },
  stepCompleted: {
    backgroundColor: Colors.success[500],
  },
  stepNumber: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  stepContent: {
    paddingVertical: Spacing.lg,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
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
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  switchLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[500],
    backgroundColor: Colors.background.primary,
  },
  navButtonText: {
    color: Colors.primary[500],
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    marginHorizontal: Spacing.xs,
  },
  navSpacer: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.neutral[400],
  },
  submitButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  uploadButtonSuccess: {
    borderColor: Colors.success[500],
    borderWidth: 2,
  },
  uploadButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  uploadButtonTextSuccess: {
    color: Colors.success[500],
  },
  uploadCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
})
