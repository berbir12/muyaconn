import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface NotificationSettingsProps {
  visible: boolean
  onClose: () => void
}

export default function NotificationSettings({ visible, onClose }: NotificationSettingsProps) {
  const { profile } = useAuth()
  const { markAllAsRead } = useNotifications()
  
  const [settings, setSettings] = useState({
    applicationUpdates: true,
    directBookings: true,
    taskUpdates: true,
    messages: true,
    reviews: true,
    systemNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
  })

  const [loading, setLoading] = useState(false)

  const handleToggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true)
      await markAllAsRead()
      Alert.alert('Success', 'All notifications marked as read!')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark notifications as read')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      // Here you would typically save the settings to the database
      // For now, we'll just show a success message
      Alert.alert('Success', 'Notification settings saved!')
      onClose()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const renderSettingRow = (
    key: keyof typeof settings,
    title: string,
    description: string,
    icon: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <Ionicons name={icon as any} size={20} color={Colors.primary[500]} />
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => handleToggleSetting(key)}
        trackColor={{ false: Colors.neutral[300], true: Colors.primary[300] }}
        thumbColor={settings[key] ? Colors.primary[500] : Colors.neutral[400]}
      />
    </View>
  )

  if (!visible) return null

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAllAsRead}
              disabled={loading}
            >
              <Ionicons name="checkmark-done" size={20} color={Colors.primary[500]} />
              <Text style={styles.actionButtonText}>Mark All as Read</Text>
            </TouchableOpacity>
          </View>

          {/* Notification Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            
            {renderSettingRow(
              'applicationUpdates',
              'Application Updates',
              'Get notified when your task applications are accepted or declined',
              'document-text'
            )}
            
            {renderSettingRow(
              'directBookings',
              'Direct Bookings',
              'Receive notifications for new booking requests and status changes',
              'calendar'
            )}
            
            {renderSettingRow(
              'taskUpdates',
              'Task Updates',
              'Stay informed about task status changes and assignments',
              'briefcase'
            )}
            
            {renderSettingRow(
              'messages',
              'Messages',
              'Get notified about new messages from taskers or customers',
              'chatbubble'
            )}
            
            {renderSettingRow(
              'reviews',
              'Reviews',
              'Receive notifications when someone leaves you a review',
              'star'
            )}
            
            {renderSettingRow(
              'systemNotifications',
              'System Notifications',
              'Important updates about your account and app features',
              'settings'
            )}
          </View>

          {/* Delivery Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Methods</Text>
            
            {renderSettingRow(
              'pushNotifications',
              'Push Notifications',
              'Receive notifications on your device',
              'phone-portrait'
            )}
            
            {renderSettingRow(
              'emailNotifications',
              'Email Notifications',
              'Get notifications sent to your email address',
              'mail'
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveSettings}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <Text style={styles.saveButtonText}>Save Settings</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    shadowColor: Colors.shadow.heavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: Colors.primary[700],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  settingTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.neutral[400],
  },
  saveButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
})
