import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface UserInfo {
  id: string
  email: string
  role: string
  profile: any
}

export interface LoginResponse {
  user: UserInfo
  session: any
}

export class AuthService {
  private static readonly USER_STORAGE_KEY = 'user_info'
  private static readonly SESSION_STORAGE_KEY = 'user_session'

  /**
   * Login with email and password using Supabase
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.user || !data.session) {
        throw new Error('Login failed - no user or session returned')
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.warn('Profile fetch error:', profileError)
      }

      const userInfo: UserInfo = {
        id: data.user.id,
        email: data.user.email || '',
        role: profile?.role || 'customer',
        profile: profile
      }

      const loginResponse: LoginResponse = {
        user: userInfo,
        session: data.session
      }

      // Store user info and session
      await this.storeUserInfo(userInfo)
      await this.storeSession(data.session)
      
      return loginResponse
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  /**
   * Register new user using Supabase
   */
  static async register(
    email: string, 
    password: string, 
    fullName: string, 
    username: string, 
    phone?: string
  ): Promise<LoginResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
            phone: phone,
          }
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error('Registration failed - no user returned')
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          username: username,
          phone: phone,
          role: 'customer',
          created_at: new Date().toISOString(),
        })

      if (profileError) {
        console.warn('Profile creation error:', profileError)
      }

      const userInfo: UserInfo = {
        id: data.user.id,
        email: data.user.email || '',
        role: 'customer',
        profile: {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          username: username,
          phone: phone,
          role: 'customer',
        }
      }

      const loginResponse: LoginResponse = {
        user: userInfo,
        session: data.session
      }

      // Store user info and session if available
      await this.storeUserInfo(userInfo)
      if (data.session) {
        await this.storeSession(data.session)
      }
      
      return loginResponse
    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(error.message || 'Registration failed')
    }
  }

  /**
   * Get current user info from Supabase
   */
  static async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.warn('Profile fetch error:', profileError)
      }

      const userInfo: UserInfo = {
        id: user.id,
        email: user.email || '',
        role: profile?.role || 'customer',
        profile: profile
      }

      await this.storeUserInfo(userInfo)
      return userInfo
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  /**
   * Logout user using Supabase
   */
  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      await this.clearStoredData()
    }
  }

  /**
   * Store user info using AsyncStorage
   */
  private static async storeUserInfo(userInfo: UserInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(userInfo))
    } catch (error) {
      console.error('Error storing user info:', error)
    }
  }

  /**
   * Get stored user info from AsyncStorage
   */
  private static async getStoredUserInfo(): Promise<UserInfo | null> {
    try {
      const userJson = await AsyncStorage.getItem(this.USER_STORAGE_KEY)
      return userJson ? JSON.parse(userJson) : null
    } catch (error) {
      console.error('Error getting stored user info:', error)
      return null
    }
  }

  /**
   * Store session using AsyncStorage
   */
  private static async storeSession(session: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Error storing session:', error)
    }
  }

  /**
   * Get stored session from AsyncStorage
   */
  private static async getStoredSession(): Promise<any | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(this.SESSION_STORAGE_KEY)
      return sessionJson ? JSON.parse(sessionJson) : null
    } catch (error) {
      console.error('Error getting stored session:', error)
      return null
    }
  }

  /**
   * Clear all stored data
   */
  private static async clearStoredData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.USER_STORAGE_KEY),
        AsyncStorage.removeItem(this.SESSION_STORAGE_KEY),
      ])
    } catch (error) {
      console.error('Error clearing stored data:', error)
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  }

  /**
   * Get current access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }
}
