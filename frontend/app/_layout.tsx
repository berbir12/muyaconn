import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import Colors from '../constants/Colors'

function TabNavigator() {
  const { user, isAuthenticated } = useAuth()
  
  // Determine which tabs to show based on user role
  const isTasker = user?.currentMode === 'tasker'
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[200],
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        headerShown: false,
      }}
    >
      {/* Auth Tab - Hidden from tabs, only accessible when not authenticated */}
      <Tabs.Screen
        name="auth"
        options={{
          title: 'Auth',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-in" size={size} color={color} />
          ),
          href: null, // Hide from tab bar
        }}
      />
      
      {/* Home Tab - Always visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      
      {/* Jobs Tab - Always visible */}
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      
      {/* Bookings Tab - Only for Taskers */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          href: isTasker ? undefined : null, // Hide for customers
        }}
      />
      
      {/* Chat Tab - Always visible */}
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      
      {/* Profile Tab - Always visible */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TabNavigator />
    </AuthProvider>
  )
}