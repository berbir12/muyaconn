import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { router } from 'expo-router'
import { ActivityIndicator } from 'react-native'

export default function Index() {
  const { session, loading, profile, isOfflineMode } = useAuth()

  useEffect(() => {
    if (!loading) {
      // In offline mode, we only need profile to be set
      if (isOfflineMode) {
        if (!profile) {
          router.replace('/auth')
        } else {
          router.replace('/home')
        }
      } else {
        // In online mode, we need both session and profile
        if (!session) {
          router.replace('/auth')
        } else if (!profile) {
          router.replace('/setup-profile')
        } else {
          router.replace('/home')
        }
      }
    }
  }, [session, loading, profile, isOfflineMode])

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