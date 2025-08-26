import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase, UserProfile } from '../lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isOfflineMode: boolean
}

interface SignUpData {
  full_name: string
  username: string
  role: 'customer' | 'tasker'
}

// Mock users for fallback authentication
const MOCK_USERS = [
  {
    id: 'customer-demo',
    email: 'customer@demo.com',
    password: 'demo123',
    profile: {
      id: 'customer-demo',
      username: 'demo_customer',
      full_name: 'John Smith',
      role: 'customer' as const,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  },
  {
    id: 'tasker-demo',
    email: 'tasker@demo.com',
    password: 'demo123',
    profile: {
      id: 'tasker-demo',
      username: 'demo_tasker',
      full_name: 'Sarah Wilson',
      role: 'tasker' as const,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
]

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Try to get session from Supabase first
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.log('Supabase auth failed, switching to offline mode:', error.message)
        await initializeOfflineMode()
        return
      }

      console.log('Initial session:', session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }

      // Set up auth state listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      console.log('Network error, switching to offline mode:', error)
      await initializeOfflineMode()
    }
  }

  const initializeOfflineMode = async () => {
    setIsOfflineMode(true)
    
    try {
      // Check for stored offline session
      const storedSession = await AsyncStorage.getItem('offline_session')
      if (storedSession) {
        const sessionData = JSON.parse(storedSession)
        setProfile(sessionData.profile)
        console.log('Restored offline session for:', sessionData.profile.full_name)
      }
    } catch (error) {
      console.error('Error loading offline session:', error)
    }
    
    setLoading(false)
  }

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found, will be created by trigger')
          setTimeout(() => fetchProfile(userId), 1000)
          return
        }
        throw error
      }

      if (data) {
        console.log('Profile loaded:', data.role, data.full_name)
        setProfile(data)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching profile:', error)
      
      // Fallback to mock profile
      const mockUser = MOCK_USERS.find(u => u.id === userId)
      if (mockUser) {
        setProfile(mockUser.profile)
      }
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      if (isOfflineMode) {
        // Offline authentication
        const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password)
        if (!mockUser) {
          throw new Error('Invalid email or password')
        }
        
        setProfile(mockUser.profile)
        
        // Store session for persistence
        await AsyncStorage.setItem('offline_session', JSON.stringify({
          profile: mockUser.profile,
          timestamp: Date.now()
        }))
        
        setLoading(false)
        return
      }

      // Try Supabase authentication
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        // If network error, switch to offline mode and authenticate locally
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          console.log('Network error during sign in, switching to offline mode')
          setIsOfflineMode(true)
          
          // Authenticate with mock users directly
          const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password)
          if (!mockUser) {
            throw new Error('Invalid email or password')
          }
          
          setProfile(mockUser.profile)
          
          // Store session for persistence
          await AsyncStorage.setItem('offline_session', JSON.stringify({
            profile: mockUser.profile,
            timestamp: Date.now()
          }))
          
          setLoading(false)
          return
        }
        throw error
      }
    } catch (error: any) {
      setLoading(false)
      
      // If it's a network error, switch to offline mode and try mock authentication
      if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        console.log('Network error caught, switching to offline mode')
        setIsOfflineMode(true)
        
        // Try mock authentication
        const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password)
        if (!mockUser) {
          throw new Error('Network connection failed. Please use demo credentials: customer@demo.com / demo123 or tasker@demo.com / demo123')
        }
        
        setProfile(mockUser.profile)
        
        // Store session for persistence
        await AsyncStorage.setItem('offline_session', JSON.stringify({
          profile: mockUser.profile,
          timestamp: Date.now()
        }))
        
        setLoading(false)
        return
      }
      
      throw error
    }
  }

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    setLoading(true)
    try {
      if (isOfflineMode) {
        // For offline mode, create a new mock user
        const newUser = {
          id: `user-${Date.now()}`,
          email,
          password,
          profile: {
            id: `user-${Date.now()}`,
            username: userData.username,
            full_name: userData.full_name,
            role: userData.role,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
        
        MOCK_USERS.push(newUser)
        setProfile(newUser.profile)
        
        await AsyncStorage.setItem('offline_session', JSON.stringify({
          profile: newUser.profile,
          timestamp: Date.now()
        }))
        
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            username: userData.username,
            role: userData.role,
          },
        },
      })
      
      if (error) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          console.log('Network error during sign up, trying offline mode')
          setIsOfflineMode(true)
          await signUp(email, password, userData)
          return
        }
        throw error
      }
    } catch (error: any) {
      setLoading(false)
      
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        throw new Error('Network connection failed. Account created in offline mode.')
      }
      
      throw error
    }
  }

  const signOut = async () => {
    if (isOfflineMode) {
      setProfile(null)
      await AsyncStorage.removeItem('offline_session')
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = async () => {
    if (user && !isOfflineMode) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isOfflineMode,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}