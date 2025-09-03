import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import Colors from '../constants/Colors'

function TabNavigator() {
  const { profile } = useAuth()
  
  // Only show Bookings tab for users with tasker role (tasker or both)
  const showBookingsTab = profile?.role === 'tasker' || profile?.role === 'both'

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
          height: 88,
        },
        headerShown: false,
      }}
    >
      {/* Main visible tabs - consolidated functionality */}
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      
      {/* Bookings tab - conditionally visible based on user role */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          href: showBookingsTab ? undefined : null, // Hide tab if user is not a tasker
        }}
      />
      
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      

      
                  {/* Essential hidden screens only */}
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        
        <Tabs.Screen
          name="active-work"
          options={{
            href: null,
          }}
        />
        
        <Tabs.Screen
          name="taskers"
          options={{
            href: null,
          }}
        />
        
        <Tabs.Screen
          name="task"
          options={{
            href: null,
          }}
        />
      
      <Tabs.Screen
        name="auth"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="setup-profile"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="post-task"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}

export default function RootLayout() {
  return (
      <AuthProvider>
      <NotificationProvider>
        <TabNavigator />
      </NotificationProvider>
      </AuthProvider>
  )
}