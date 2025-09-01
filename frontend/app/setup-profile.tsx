import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { router } from 'expo-router'
import Colors from '../constants/Colors'

export default function SetupProfile() {
  const { user, refreshProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'customer' | 'tasker'>('customer')
  const [loading, setLoading] = useState(false)

  const handleCreateProfile = async () => {
    if (!username || !fullName) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (!user) {
      Alert.alert('Error', 'User not found')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        username: username.trim(),
        full_name: fullName.trim(),
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      await refreshProfile()
      router.replace('/')
    } catch (error: any) {
      Alert.alert('Profile Setup Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Let's set up your profile to get started
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={Colors.text.tertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.text.tertiary}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Account Type:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'customer' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('customer')}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'customer' && styles.roleButtonTextActive,
                    ]}
                  >
                    Customer
                  </Text>
                  <Text style={styles.roleDescription}>
                    Find and book services
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'tasker' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('tasker')}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'tasker' && styles.roleButtonTextActive,
                    ]}
                  >
                    Tasker
                  </Text>
                  <Text style={styles.roleDescription}>
                    Offer your services
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCreateProfile}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Profile...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  roleButtons: {
    gap: 12,
  },
  roleButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  roleDescription: {
    fontSize: 14,
    color: '#999',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})