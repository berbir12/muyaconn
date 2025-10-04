import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { TaskerApplicationService } from '../services/TaskerApplicationService'
import Colors from '../constants/Colors'

const { width } = Dimensions.get('window')

const skills = [
  'Cleaning', 'Handyman', 'Delivery', 'Photography', 'Technology', 
  'Gardening', 'Cooking', 'Tutoring', 'Pet Care', 'Moving', 
  'Painting', 'Plumbing', 'Electrical', 'Carpentry', 'Landscaping'
]

const experienceLevels = [
  { value: 'beginner', label: 'Beginner (0-1 years)' },
  { value: 'intermediate', label: 'Intermediate (1-3 years)' },
  { value: 'advanced', label: 'Advanced (3-5 years)' },
  { value: 'expert', label: 'Expert (5+ years)' }
]

export default function TaskerApplication() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.profile?.email || '',
    phone: user?.phone || '',
    bio: '',
    skills: [] as string[],
    experience: '',
    hourlyRate: '',
    availability: 'flexible',
    languages: [] as string[],
    certifications: [] as string[],
    portfolio: [] as string[],
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    idNumber: '',
    bankAccount: '',
    taxId: ''
  })

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }))
  }

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to submit an application')
      return
    }

    if (!formData.fullName || !formData.bio || formData.skills.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Check if user is already a tasker
      const isAlreadyTasker = await TaskerApplicationService.isUserTasker(user.id)
      if (isAlreadyTasker) {
        Alert.alert('Already a Tasker', 'You are already an active tasker!')
        return
      }

      // Check if user already has a pending application
      const existingApplication = await TaskerApplicationService.getUserApplication(user.id)
      if (existingApplication) {
        Alert.alert('Application Already Submitted', 'You already have a pending tasker application.')
        return
      }

      // Submit the application
      const applicationData = {
        user_id: user.id,
        status: 'pending' as const,
        personal_info: {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          bio: formData.bio,
          emergency_contact: formData.emergencyContact
        },
        professional_info: {
          skills: formData.skills,
          experience: formData.experience,
          hourly_rate: parseFloat(formData.hourlyRate) || 0,
          availability: formData.availability,
          languages: formData.languages,
          certifications: formData.certifications,
          portfolio: formData.portfolio
        },
        verification: {
          id_verified: false,
          background_check: false,
          insurance: false,
          references: false
        }
      }

      const application = await TaskerApplicationService.submitApplication(applicationData)
      
      if (application) {
        Alert.alert(
          'Application Submitted!',
          'Your tasker application has been submitted for review. We\'ll get back to you within 24-48 hours.',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        )
      } else {
        throw new Error('Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      Alert.alert('Error', 'Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Tasker</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.neutral[400]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email"
              placeholderTextColor={Colors.neutral[400]}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.neutral[400]}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
              placeholder="Tell us about yourself and your experience"
              placeholderTextColor={Colors.neutral[400]}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Services *</Text>
          <Text style={styles.sectionSubtitle}>Select all skills you can provide</Text>
          
          <View style={styles.skillsGrid}>
            {skills.map((skill) => (
              <TouchableOpacity
                key={skill}
                style={[
                  styles.skillChip,
                  formData.skills.includes(skill) && styles.skillChipActive
                ]}
                onPress={() => handleSkillToggle(skill)}
              >
                <Text style={[
                  styles.skillChipText,
                  formData.skills.includes(skill) && styles.skillChipTextActive
                ]}>
                  {skill}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience Level</Text>
          
          {experienceLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.radioOption,
                formData.experience === level.value && styles.radioOptionActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, experience: level.value }))}
            >
              <View style={styles.radioCircle}>
                {formData.experience === level.value && <View style={styles.radioInner} />}
              </View>
              <Text style={[
                styles.radioText,
                formData.experience === level.value && styles.radioTextActive
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hourly Rate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hourly Rate</Text>
          <Text style={styles.sectionSubtitle}>What do you charge per hour?</Text>
          
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={formData.hourlyRate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, hourlyRate: text }))}
              placeholder="Enter your hourly rate"
              placeholderTextColor={Colors.neutral[400]}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <Text style={styles.sectionSubtitle}>What languages do you speak?</Text>
          
          <View style={styles.skillsGrid}>
            {['English', 'Amharic', 'Oromo', 'Tigrinya', 'Arabic', 'French', 'Spanish'].map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.skillChip,
                  formData.languages.includes(language) && styles.skillChipActive
                ]}
                onPress={() => handleLanguageToggle(language)}
              >
                <Text style={[
                  styles.skillChipText,
                  formData.languages.includes(language) && styles.skillChipTextActive
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              placeholder="Enter your address"
              placeholderTextColor={Colors.neutral[400]}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                placeholder="City"
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                placeholder="State"
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Name</Text>
            <TextInput
              style={styles.input}
              value={formData.emergencyContact}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContact: text }))}
              placeholder="Emergency contact name"
              placeholderTextColor={Colors.neutral[400]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.emergencyPhone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyPhone: text }))}
              placeholder="Emergency contact phone"
              placeholderTextColor={Colors.neutral[400]}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Application</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.submitNote}>
            By submitting this application, you agree to our Terms of Service and Privacy Policy.
            We'll review your application and get back to you within 24-48 hours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral[900],
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.neutral[900],
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  skillChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  skillChipText: {
    fontSize: 14,
    color: Colors.neutral[600],
    fontWeight: '500',
  },
  skillChipTextActive: {
    color: '#fff',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  radioOptionActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.neutral[400],
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary[500],
  },
  radioText: {
    fontSize: 16,
    color: Colors.neutral[700],
    flex: 1,
  },
  radioTextActive: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  submitSection: {
    marginVertical: 32,
    paddingBottom: 40,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitNote: {
    fontSize: 12,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 16,
  },
})
