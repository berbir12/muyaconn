import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNotifications } from '../hooks/useNotifications'
import Colors from '../constants/Colors'
import NotificationModal from './NotificationModal'

interface NotificationButtonProps {
  size?: number
}

export default function NotificationButton({ size = 24 }: NotificationButtonProps) {
  const { unreadCount } = useNotifications()
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications" size={size} color={Colors.primary[500]} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificationModal 
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: 'bold',
  },
})
