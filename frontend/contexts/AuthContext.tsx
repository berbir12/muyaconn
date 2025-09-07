import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, UserProfile } from '../lib/supabase'
import { AuthService, UserInfo } from '../services/AuthService'

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

  const initializeAuth = useCallback(async () => {
    try {

      // Get session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Supabase auth error:', error.message)
        setLoading(false)
        return
      }

      if (session) {
        setSession(session)
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {

      }
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {

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
  }, [])

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])



  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {

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
      const response = await AuthService.login(email, password)
      
      // Update state with new user info
      setUser({
        id: response.user.id,
        email: response.user.email,
      } as User)
      
      setProfile(response.user.profile)
      
      // Also sign in with Supabase for compatibility
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        console.warn('Supabase auth error:', error)
      }
    } catch (error: any) {
      setLoading(false)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, profileData: Partial<UserProfile>) => {
    setLoading(true)
    try {
      const response = await AuthService.register(
        email,
        password,
        profileData.full_name || '',
        profileData.username || '',
        profileData.phone
      )
      
      // Update state with new user info
      setUser({
        id: response.user.id,
        email: response.user.email,
      } as User)
      
      setProfile(response.user.profile)
      
      // Also sign up with Supabase for compatibility
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: profileData,
        },
      })
      
      if (error) {
        console.warn('Supabase auth error:', error)
      }

      return { success: true, user: response.user as any }
    } catch (error: any) {
      console.error('Signup error:', error)
      setLoading(false)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await AuthService.logout()
    } catch (error) {
      console.warn('AuthService logout error:', error)
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    setUser(null)
    setSession(null)
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