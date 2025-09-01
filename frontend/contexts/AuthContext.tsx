import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, UserProfile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<{ success: boolean; user: User }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('=== Initializing Auth ===')
      // Get session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Supabase auth error:', error.message)
        setLoading(false)
        return
      }

      console.log('Session found:', !!session)
      if (session) {
        console.log('User ID:', session.user.id)
        console.log('User email:', session.user.email)
        setSession(session)
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        console.log('No session found')
      }
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', event, session?.user?.id)
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
          
          setLoading(false)
        }
      )

      setLoading(false)
      return () => subscription.unsubscribe()
    } catch (error: any) {
      console.error('Auth initialization error:', error)
      setLoading(false)
    }
  }



  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user:', userId)
          console.log('This should not happen with the database trigger - setting profile to null')
          setProfile(null)
          return
        }
        throw error
      }

      if (data) {
        setProfile(data)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        throw error
      }
    } catch (error: any) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, profileData: Partial<UserProfile>) => {
    setLoading(true)
    try {
      // Always set role as 'customer' by default
      const profileWithDefaultRole = {
        ...profileData,
        role: 'customer' as const,
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: profileWithDefaultRole,
        },
      })
      
      if (error) {
        throw error
      }

      // Check if signup was successful
      if (data.user) {
        console.log('Signup successful:', data.user.email)
        return { success: true, user: data.user }
      } else {
        throw new Error('Signup failed - no user data returned')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      setLoading(false)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) throw new Error('No profile to update')
    if (!user) throw new Error('No user logged in')
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      
      // Refresh profile data
      await refreshProfile()
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}