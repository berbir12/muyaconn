import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNotifications } from '../hooks/useNotifications'
import Colors from '../constants/Colors'

interface NotificationBannerProps {
  onPress?: () => void
}

export default function NotificationBanner({ onPress }: NotificationBannerProps) {
  const { unreadCount } = useNotifications()

  if (unreadCount === 0) return null

  return (
    <TouchableOpacity 
      style={styles.banner} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Ionicons name="notifications" size={20} color={Colors.text.inverse} />
        <Text style={styles.text}>
          {unreadCount === 1 
            ? '1 new notification' 
            : `${unreadCount} new notifications`
          }
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.text.inverse} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
})
