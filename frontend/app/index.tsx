import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { router } from 'expo-router'
import { ActivityIndicator } from 'react-native'

export default function Index() {
  const { session, loading, profile } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!session) {
        // No user session - redirect to auth
        router.replace('/auth')
      } else if (!profile) {
        // User is authenticated but has no profile
        // This should not happen with the database trigger, but if it does,
        // redirect to auth to let them sign in again (which will trigger profile creation)
        console.warn('User authenticated but no profile found - redirecting to auth')
        router.replace('/auth')
      } else {
        // User is authenticated and has profile - redirect to main app
        router.replace('/jobs')
      }
    }
  }, [session, loading, profile])

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  return <View style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})