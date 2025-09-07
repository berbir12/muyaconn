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
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { ErrorService } from '../services/ErrorService'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    if (isSignUp) {
      if (!fullName || !username) {
        Alert.alert('Error', 'Please fill in all required fields')
        return
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match')
        return
      }

      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters')
        return
      }
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const result = await signUp(email, password, {
          full_name: fullName,
          username,
        })
        
        if (result.success) {
          Alert.alert('Success', 'Account created successfully! You can now post tasks and hire taskers. Check your email to verify your account.')
          setIsSignUp(false)
          // Clear form fields
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setFullName('')
          setUsername('')
        }
      } else {
        await signIn(email, password)
        // Navigation will be handled by the auth context
      }
    } catch (error: any) {
      // Use ErrorService for consistent error handling
      ErrorService.handleError(error, {
        context: isSignUp ? 'UserRegistration' : 'UserAuthentication',
        showAlert: true,
        logError: true,
        fallbackMessage: isSignUp ? 'Registration failed' : 'Authentication failed'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setUsername('')
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary[500], Colors.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="hammer" size={64} color={Colors.text.inverse} />
          <Text style={styles.appTitle}>Muyacon</Text>
          <Text style={styles.appSubtitle}>Get things done, connect with experts</Text>
          

        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
                      <Text style={styles.formSubtitle}>
            {isSignUp ? 'Join our community of customers and taskers' : 'Sign in to continue'}
          </Text>



            {isSignUp && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.text.tertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={Colors.text.tertiary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.text.tertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password"
              />
            )}

            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.authButtonText}>
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>

            {!isSignUp && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginTop: Spacing.lg,
  },
  appSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.inverse,
    opacity: 0.9,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  form: {
    padding: Spacing.xl,
  },
  formTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  formSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  roleContainer: {
    marginBottom: Spacing.md,
  },
  roleLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  roleButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  roleButtonTextActive: {
    color: Colors.text.inverse,
  },
  authButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  toggleText: {
    color: Colors.primary[500],
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  forgotPasswordText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.md,
  },

})