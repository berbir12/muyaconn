import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNotifications } from '../hooks/useNotifications'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

export default function Settings() {
  const { profile, signOut } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const { markAllAsRead } = useNotifications()
  
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    applicationUpdates: true,
    directBookings: true,
    taskUpdates: true,
    messages: true,
    reviews: true,
    systemNotifications: true,
  })

  const handleLanguageChange = async (newLanguage: 'en' | 'am') => {
    try {
      await setLanguage(newLanguage)
      Alert.alert(
        'Success',
        'Language changed successfully',
        [{ text: 'OK' }]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to change language')
    }
  }

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      Alert.alert('Success', 'All notifications marked as read')
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notifications as read')
    }
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/auth')
          }
        },
      ]
    )
  }

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@muyacon.com?subject=Support Request')
  }

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://muyacon.com/privacy')
  }

  const handleTermsOfService = () => {
    Linking.openURL('https://muyacon.com/terms')
  }

  const renderSettingRow = (
    title: string,
    description: string,
    icon: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    showArrow: boolean = true
  ) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color={Colors.primary[500]} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description ? <Text style={styles.settingDescription}>{description}</Text> : null}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
        )}
      </View>
    </TouchableOpacity>
  )

  const renderSwitchRow = (
    title: string,
    description: string,
    icon: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color={Colors.primary[500]} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description ? <Text style={styles.settingDescription}>{description}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.neutral[300], true: Colors.primary[300] }}
        thumbColor={value ? Colors.primary[500] : Colors.neutral[400]}
      />
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Language Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'Select Language',
              'Choose your preferred language',
              'language',
              () => {
                Alert.alert(
                  'Select Language',
                  'Choose your preferred language for the app',
                  [
                    {
                      text: 'English',
                      onPress: () => handleLanguageChange('en'),
                      style: language === 'en' ? 'default' : 'cancel'
                    },
                    {
                      text: 'አማርኛ',
                      onPress: () => handleLanguageChange('am'),
                      style: language === 'am' ? 'default' : 'cancel'
                    },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                )
              },
              <Text style={styles.currentLanguage}>
                {language === 'en' ? 'English' : 'አማርኛ'}
              </Text>
            )}
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleMarkAllAsRead}
            >
              <Ionicons name="checkmark-done" size={20} color={Colors.primary[500]} />
              <Text style={styles.actionButtonText}>Mark All as Read</Text>
            </TouchableOpacity>

            {renderSwitchRow(
              'Push Notifications',
              'Receive notifications on your device',
              'phone-portrait',
              notificationSettings.pushNotifications,
              () => handleNotificationToggle('pushNotifications')
            )}

            {renderSwitchRow(
              'Email Notifications',
              'Receive notifications via email',
              'mail',
              notificationSettings.emailNotifications,
              () => handleNotificationToggle('emailNotifications')
            )}

            {renderSwitchRow(
              'Application Updates',
              'Get notified when the app updates',
              'document-text',
              notificationSettings.applicationUpdates,
              () => handleNotificationToggle('applicationUpdates')
            )}

            {renderSwitchRow(
              'Direct Bookings',
              'Get notified for new direct bookings',
              'calendar',
              notificationSettings.directBookings,
              () => handleNotificationToggle('directBookings')
            )}

            {renderSwitchRow(
              'Task Updates',
              'Get notified about task changes',
              'briefcase',
              notificationSettings.taskUpdates,
              () => handleNotificationToggle('taskUpdates')
            )}

            {renderSwitchRow(
              'Messages',
              'Get notified about new messages',
              'chatbubble',
              notificationSettings.messages,
              () => handleNotificationToggle('messages')
            )}

            {renderSwitchRow(
              'Reviews',
              'Get notified about new reviews',
              'star',
              notificationSettings.reviews,
              () => handleNotificationToggle('reviews')
            )}

            {renderSwitchRow(
              'System Notifications',
              'Essential app updates and notifications',
              'settings',
              notificationSettings.systemNotifications,
              () => handleNotificationToggle('systemNotifications')
            )}
          </View>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'Privacy Policy',
              'Read our privacy policy',
              'shield-outline',
              handlePrivacyPolicy
            )}

            {renderSettingRow(
              'Terms of Service',
              'Read our terms of service',
              'document-text-outline',
              handleTermsOfService
            )}

            {renderSettingRow(
              'Export Data',
              'Download your data',
              'download-outline',
              () => Alert.alert('Coming Soon', 'Data export feature coming soon')
            )}

            {renderSettingRow(
              'Delete Account',
              'Permanently delete your account',
              'trash-outline',
              () => Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete Account', 
                    style: 'destructive',
                    onPress: () => Alert.alert('Coming Soon', 'Account deletion feature coming soon')
                  }
                ]
              )
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'Edit Profile',
              'Update your profile information',
              'person-outline',
              () => router.push('/profile')
            )}

            {renderSettingRow(
              'Change Password',
              'Update your account password',
              'lock-closed-outline',
              () => Alert.alert('Coming Soon', 'Password change feature coming soon')
            )}

            {renderSettingRow(
              'Two-Factor Authentication',
              'Add extra security to your account',
              'shield-checkmark-outline',
              () => Alert.alert('Coming Soon', 'Two-factor authentication coming soon')
            )}

            {renderSettingRow(
              'Connected Accounts',
              'Manage linked social accounts',
              'link-outline',
              () => Alert.alert('Coming Soon', 'Connected accounts feature coming soon')
            )}
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'Theme',
              'Change app appearance',
              'color-palette-outline',
              () => Alert.alert('Coming Soon', 'Theme selection coming soon')
            )}

            {renderSettingRow(
              'Font Size',
              'Adjust text size',
              'text-outline',
              () => Alert.alert('Coming Soon', 'Font size adjustment coming soon')
            )}

            {renderSettingRow(
              'Clear Cache',
              'Free up storage space',
              'refresh-outline',
              () => Alert.alert('Coming Soon', 'Cache clearing feature coming soon')
            )}

            {renderSettingRow(
              'Storage Usage',
              'View app storage usage',
              'folder-outline',
              () => Alert.alert('Coming Soon', 'Storage usage feature coming soon')
            )}
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'Help Center',
              'Get help and support',
              'help-circle-outline',
              () => Alert.alert('Coming Soon', 'Help center coming soon')
            )}

            {renderSettingRow(
              'Contact Support',
              'Send us a message',
              'mail-outline',
              handleContactSupport
            )}

            {renderSettingRow(
              'Send Feedback',
              'Share your thoughts',
              'chatbubble-outline',
              () => Alert.alert('Coming Soon', 'Feedback feature coming soon')
            )}

            {renderSettingRow(
              'Rate App',
              'Rate us on the app store',
              'star-outline',
              () => Alert.alert('Coming Soon', 'App rating feature coming soon')
            )}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'Version',
              '1.0.0',
              'information-circle-outline',
              undefined,
              undefined,
              false
            )}

            {renderSettingRow(
              'Build',
              '2024.01.15',
              'build-outline',
              undefined,
              undefined,
              false
            )}

            {renderSettingRow(
              'Legal',
              'Terms and privacy information',
              'document-outline',
              () => Alert.alert('Coming Soon', 'Legal information coming soon')
            )}
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={Colors.error[500]} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLanguage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
    marginRight: Spacing.sm,
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
    margin: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: Colors.primary[700],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error[500],
    gap: Spacing.sm,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    color: Colors.error[500],
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
})
