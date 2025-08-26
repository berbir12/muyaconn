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
import { useAuth } from '../contexts/AuthContext'
import { router } from 'expo-router'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/Design'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<'customer' | 'tasker'>('customer')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, isOfflineMode } = useAuth()

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      // Navigation will be handled by the auth context
    } catch (error: any) {
      console.error('Sign in error:', error)
      Alert.alert('Sign In Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!email || !password || !fullName || !username) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    // Validate username
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, {
        full_name: fullName,
        username,
        role,
      })
      
      Alert.alert(
        'Success!', 
        'Account created successfully! You can now sign in.',
        [
          {
            text: 'Sign In Now',
            onPress: () => {
              setIsSignUp(false)
              setPassword('')
            }
          }
        ]
      )
    } catch (error: any) {
      console.error('Sign up error:', error)
      Alert.alert('Sign Up Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = (userType: 'customer' | 'tasker') => {
    if (userType === 'customer') {
      setEmail('customer@demo.com')
      setPassword('demo123')
    } else {
      setEmail('tasker@demo.com')
      setPassword('demo123')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header with gradient */}
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.title}>SkillHub</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
            
            {/* Connection status */}
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: isOfflineMode ? Colors.warning[500] : Colors.success[500] }
              ]} />
              <Text style={styles.statusText}>
                {isOfflineMode ? 'Demo Mode' : 'Online'}
              </Text>
            </View>
          </LinearGradient>

          {/* Demo credentials section */}
          {!isSignUp && (
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Try Demo Accounts:</Text>
              <View style={styles.demoButtons}>
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: Colors.primary[50] }]}
                  onPress={() => fillDemoCredentials('customer')}
                >
                  <Ionicons name="person" size={20} color={Colors.primary[600]} />
                  <Text style={[styles.demoButtonText, { color: Colors.primary[600] }]}>
                    Customer Demo
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: Colors.success[50] }]}
                  onPress={() => fillDemoCredentials('tasker')}
                >
                  <Ionicons name="hammer" size={20} color={Colors.success[600]} />
                  <Text style={[styles.demoButtonText, { color: Colors.success[600] }]}>
                    Tasker Demo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            {isSignUp && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="at" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={Colors.text.tertiary}
                  />
                </View>

                <View style={styles.roleContainer}>
                  <Text style={styles.roleLabel}>I want to:</Text>
                  <View style={styles.roleButtons}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        role === 'customer' && styles.roleButtonActive,
                      ]}
                      onPress={() => setRole('customer')}
                    >
                      <Ionicons 
                        name="person-circle" 
                        size={32} 
                        color={role === 'customer' ? Colors.text.inverse : Colors.primary[500]} 
                      />
                      <Text
                        style={[
                          styles.roleButtonText,
                          role === 'customer' && styles.roleButtonTextActive,
                        ]}
                      >
                        Hire Taskers
                      </Text>
                      <Text style={[
                        styles.roleButtonDesc,
                        role === 'customer' && styles.roleButtonDescActive,
                      ]}>
                        Post tasks and hire help
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        role === 'tasker' && styles.roleButtonActive,
                      ]}
                      onPress={() => setRole('tasker')}
                    >
                      <Ionicons 
                        name="hammer" 
                        size={32} 
                        color={role === 'tasker' ? Colors.text.inverse : Colors.success[500]} 
                      />
                      <Text
                        style={[
                          styles.roleButtonText,
                          role === 'tasker' && styles.roleButtonTextActive,
                        ]}
                      >
                        Work as Tasker
                      </Text>
                      <Text style={[
                        styles.roleButtonDesc,
                        role === 'tasker' && styles.roleButtonDescActive,
                      ]}>
                        Earn money helping others
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={isSignUp ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? [Colors.neutral[400], Colors.neutral[500]] : Colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading && <Ionicons name="refresh" size={20} color={Colors.text.inverse} style={styles.loadingIcon} />}
                <Text style={styles.buttonText}>
                  {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchButtonText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
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
    backgroundColor: Colors.background.secondary,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.giant,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.inverse,
    textAlign: 'center',
    opacity: 0.9,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
  demoSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  demoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  demoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  demoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  demoButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadows.sm,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  roleContainer: {
    marginBottom: Spacing.lg,
  },
  roleLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.lg,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  roleButtons: {
    gap: Spacing.md,
  },
  roleButton: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    ...Shadows.sm,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  roleButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  roleButtonTextActive: {
    color: Colors.text.inverse,
  },
  roleButtonDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  roleButtonDescActive: {
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  button: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingIcon: {
    marginRight: Spacing.sm,
  },
  buttonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  switchButtonText: {
    color: Colors.primary[500],
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
})