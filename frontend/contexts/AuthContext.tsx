import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ProfileService, Profile } from '../services/ProfileService'
import { generateUUID } from '../utils/uuid'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface User {
  id: string
  phone: string
  name: string
  role: 'customer' | 'tasker' | 'both'
  currentMode: 'customer' | 'tasker'
  profile?: Profile
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (phone: string, name: string) => Promise<void>
  logout: () => Promise<void>
  switchMode: (mode: 'customer' | 'tasker') => Promise<void>
  sendVerificationCode: (phone: string, fullName: string, username: string) => Promise<{ success: boolean, error?: string }>
  verifyPhoneCode: (phone: string, code: string) => Promise<boolean>
  isPhoneRegistered: (phone: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
    
    // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
          await loadUserProfile(session.user.id)
          } else {
            setUser(null)
        }
        setIsLoading(false)
      }
    )

      return () => subscription.unsubscribe()
  }, [])

  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await ProfileService.getProfile(userId)
      if (profile) {
        setUser({
          id: profile.id,
          phone: profile.phone,
          name: profile.full_name,
          role: profile.role,
          currentMode: profile.role === 'both' ? 'customer' : profile.role as 'customer' | 'tasker',
          profile
        })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const sendVerificationCode = async (phone: string, fullName: string, username: string): Promise<{ success: boolean, error?: string }> => {
    try {
      // Store user details temporarily (don't create user yet)
      // Just send verification code
      const result = await ProfileService.sendPhoneVerificationCode(phone)
      
      if (!result.success) {
        return result
      }
      
      // Store user details for later use
      // We'll use AsyncStorage to temporarily store the user details
      const userDetails = {
        phone,
        fullName,
        username,
        timestamp: Date.now()
      }
      
      // Store in AsyncStorage temporarily
      await AsyncStorage.setItem('temp_user_details', JSON.stringify(userDetails))
      
      return { success: true }
    } catch (error) {
      console.error('Error sending verification code:', error)
      return { success: false, error: 'Failed to send verification code' }
    }
  }

  const verifyPhoneCode = async (phone: string, code: string): Promise<boolean> => {
    try {
      // First, check if user already exists
      let existingProfile = await ProfileService.getUserByPhone(phone)
      
      if (existingProfile) {
        // User exists, verify the code and log them in
        const result = await ProfileService.verifyPhoneNumber(phone, code)
        if (!result.success) {
          console.error('Phone verification failed for existing user:', result.error)
          return false
        }

        // Load their profile
        setUser({
          id: existingProfile.id,
          phone: existingProfile.phone,
          name: existingProfile.full_name,
          role: existingProfile.role,
          currentMode: existingProfile.role === 'both' ? 'customer' : existingProfile.role,
          profile: existingProfile
        })
        console.log('Loaded existing user profile')
        return true
      }

      // New user - verify the code first
      const result = await ProfileService.verifyPhoneNumber(phone, code)
      if (!result.success) {
        console.error('Phone verification failed:', result.error)
        return false
      }

      // Get stored user details
      const tempUserDetails = await AsyncStorage.getItem('temp_user_details')
      
      if (!tempUserDetails) {
        console.error('No temporary user details found')
        return false
      }

      const userDetails = JSON.parse(tempUserDetails)
      
      // For now, create a temporary user since we don't have Supabase Auth set up
      // In production, you would use Supabase Auth here
      const tempUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
      
      console.log('Phone verification successful, creating temporary user:', tempUserId)

      // Create profile for the new user
      const profile = await ProfileService.createUserProfile(
        tempUserId,
        phone,
        userDetails.fullName,
        userDetails.username
      )
      
      if (profile) {
        setUser({
          id: profile.id,
          phone: profile.phone,
          name: profile.full_name,
          role: profile.role,
          currentMode: profile.role === 'both' ? 'customer' : profile.role as 'customer' | 'tasker',
          profile
        })
        console.log('Created new user profile')
      } else {
        // Fallback to temporary user if profile creation fails
        const tempUser = {
          id: tempUserId,
          phone: phone,
          name: userDetails.fullName,
          role: 'customer' as const,
          currentMode: 'customer' as const,
          profile: undefined
        }
        
        setUser(tempUser)
        console.log('Created temporary user (profile creation failed)')
      }

      // Clean up temporary user details
      await AsyncStorage.removeItem('temp_user_details')

      return true
    } catch (error) {
      console.error('Error verifying phone code:', error)
      return false
    }
  }

  const isPhoneRegistered = async (phone: string): Promise<boolean> => {
    try {
      const profile = await ProfileService.getUserByPhone(phone)
      return !!profile
    } catch (error) {
      console.error('Error checking phone registration:', error)
      return false
    }
  }

  const login = async (phone: string, name: string) => {
    try {
      // Get the current authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        throw new Error('No authenticated user found')
      }

      // Get or create profile
      let profile = await ProfileService.getUserByPhone(phone)
      
      if (!profile) {
        // Create profile for the authenticated user
        profile = await ProfileService.createUserProfile(
          authUser.id,
          phone,
          name
        )
      }
      
      if (profile) {
        setUser({
          id: profile.id,
          phone: profile.phone,
          name: profile.full_name,
          role: profile.role,
          currentMode: profile.role === 'both' ? 'customer' : profile.role as 'customer' | 'tasker',
          profile
        })
      } else {
        throw new Error('Failed to create or load user profile')
      }
    } catch (error) {
      console.error('Error logging in:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const switchMode = async (mode: 'customer' | 'tasker') => {
    if (!user) return
    
    try {
      // Update the user's current mode without changing their role
      setUser(prev => prev ? { ...prev, currentMode: mode } : null)
    } catch (error) {
      console.error('Error switching mode:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
    user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      switchMode,
    sendVerificationCode,
    verifyPhoneCode,
      isPhoneRegistered
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}