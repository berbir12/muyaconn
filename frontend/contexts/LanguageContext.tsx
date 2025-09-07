import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Language = 'en' | 'am'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => Promise<void>
  t: (key: string) => string
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation keys and their values
const translations = {
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.done': 'Done',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    
    // Navigation
    'nav.jobs': 'Jobs',
    'nav.bookings': 'Bookings',
    'nav.chats': 'Chats',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy & Security',
    'settings.account': 'Account',
    'settings.about': 'About',
    'settings.help': 'Help & Support',
    'settings.app': 'App',
    'settings.language.select': 'Select Language',
    'settings.language.english': 'English',
    'settings.language.amharic': 'አማርኛ',
    'settings.language.description': 'Choose your preferred language',
    'settings.language.selectDescription': 'Select your preferred language for the app',
    'settings.language.changed': 'Language changed successfully',
    'settings.language.changeError': 'Failed to change language',
    'settings.privacyPolicy': 'Privacy Policy',
    'settings.privacyPolicyDesc': 'Read our privacy policy',
    'settings.termsOfService': 'Terms of Service',
    'settings.termsOfServiceDesc': 'Read our terms of service',
    'settings.dataExport': 'Export Data',
    'settings.dataExportDesc': 'Download your data',
    'settings.dataExportComingSoon': 'Data export feature coming soon',
    'settings.deleteAccount': 'Delete Account',
    'settings.deleteAccountDesc': 'Permanently delete your account',
    'settings.deleteAccountConfirm': 'Are you sure you want to delete your account? This action cannot be undone.',
    'settings.deleteAccountComingSoon': 'Account deletion feature coming soon',
    'settings.editProfile': 'Edit Profile',
    'settings.editProfileDesc': 'Update your personal information',
    'settings.changePassword': 'Change Password',
    'settings.changePasswordDesc': 'Update your password',
    'settings.changePasswordComingSoon': 'Password change feature coming soon',
    'settings.twoFactorAuth': 'Two-Factor Authentication',
    'settings.twoFactorAuthDesc': 'Add extra security to your account',
    'settings.twoFactorAuthComingSoon': 'Two-factor authentication coming soon',
    'settings.connectedAccounts': 'Connected Accounts',
    'settings.connectedAccountsDesc': 'Manage linked accounts',
    'settings.connectedAccountsComingSoon': 'Connected accounts feature coming soon',
    'settings.theme': 'Theme',
    'settings.themeDesc': 'Choose your preferred theme',
    'settings.themeComingSoon': 'Theme selection coming soon',
    'settings.fontSize': 'Font Size',
    'settings.fontSizeDesc': 'Adjust text size',
    'settings.fontSizeComingSoon': 'Font size adjustment coming soon',
    'settings.cache': 'Clear Cache',
    'settings.cacheDesc': 'Clear app cache',
    'settings.cacheComingSoon': 'Cache management coming soon',
    'settings.storage': 'Storage',
    'settings.storageDesc': 'Manage app storage',
    'settings.storageComingSoon': 'Storage management coming soon',
    'settings.helpCenter': 'Help Center',
    'settings.helpCenterDesc': 'Browse help articles',
    'settings.helpCenterComingSoon': 'Help center coming soon',
    'settings.contactSupport': 'Contact Support',
    'settings.contactSupportDesc': 'Get help from our team',
    'settings.feedback': 'Send Feedback',
    'settings.feedbackDesc': 'Share your thoughts',
    'settings.feedbackComingSoon': 'Feedback system coming soon',
    'settings.rateApp': 'Rate App',
    'settings.rateAppDesc': 'Rate us on the app store',
    'settings.rateAppComingSoon': 'App rating coming soon',
    'settings.version': 'Version',
    'settings.build': 'Build',
    'settings.legal': 'Legal',
    'settings.legalDesc': 'Legal information',
    'settings.legalComingSoon': 'Legal information coming soon',
    
    // Profile
    'profile.title': 'Profile',
    'profile.personalInfo': 'Personal Information',
    'profile.professionalInfo': 'Professional Information',
    'profile.location': 'Location',
    'profile.quickActions': 'Quick Actions',
    'profile.becomeTasker': 'Become a Tasker',
    'profile.taskerStatus': 'Tasker Status',
    'profile.signOut': 'Sign Out',
    'profile.fullName': 'Full Name',
    'profile.username': 'Username',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.bio': 'Bio',
    'profile.city': 'City',
    'profile.state': 'State',
    'profile.memberSince': 'Member Since',
    'profile.hourlyRate': 'Hourly Rate',
    'profile.experienceYears': 'Years of Experience',
    'profile.responseTime': 'Response Time',
    'profile.skills': 'Skills',
    'profile.certifications': 'Certifications',
    'profile.languages': 'Languages',
    'profile.availableForWork': 'Available for Work',
    'profile.jobsCompleted': 'Jobs Completed',
    'profile.rating': 'Rating',
    'profile.reviews': 'Reviews',
    'profile.available': 'Available',
    'profile.notAvailable': 'Not Available',
    'profile.myBookings': 'My Bookings',
    'profile.noBookings': 'No bookings yet',
    'profile.viewAllTasks': 'View All Tasks',
    
    // Jobs
    'jobs.title': 'Jobs',
    'jobs.postTask': 'Post a Task',
    'jobs.findTaskers': 'Find Taskers',
    'jobs.activeWork': 'Active Work',
    'jobs.completed': 'Completed',
    'jobs.cancelled': 'Cancelled',
    
    // Bookings
    'bookings.title': 'Bookings',
    'bookings.upcoming': 'Upcoming',
    'bookings.past': 'Past',
    'bookings.noBookings': 'No bookings found',
    
    // Chats
    'chats.title': 'Chats',
    'chats.noMessages': 'No messages yet',
    'chats.startConversation': 'Start a conversation',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.markAllRead': 'Mark All as Read',
    'notifications.markAllReadError': 'Failed to mark notifications as read',
    'notifications.types': 'Notification Types',
    'notifications.deliveryMethods': 'Delivery Methods',
    'notifications.applicationUpdates': 'Application Updates',
    'notifications.applicationUpdatesDesc': 'Get notified when your applications are updated',
    'notifications.directBookings': 'Direct Bookings',
    'notifications.directBookingsDesc': 'Receive notifications for new bookings',
    'notifications.taskUpdates': 'Task Updates',
    'notifications.taskUpdatesDesc': 'Stay informed about task changes',
    'notifications.messages': 'Messages',
    'notifications.messagesDesc': 'Get notified about new messages',
    'notifications.reviews': 'Reviews',
    'notifications.reviewsDesc': 'Receive notifications for new reviews',
    'notifications.systemNotifications': 'System Notifications',
    'notifications.systemNotificationsDesc': 'Important app updates and announcements',
    'notifications.pushNotifications': 'Push Notifications',
    'notifications.pushNotificationsDesc': 'Receive notifications on your device',
    'notifications.emailNotifications': 'Email Notifications',
    'notifications.emailNotificationsDesc': 'Get notifications via email',
    
    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.signOut': 'Sign Out',
    'auth.signOutConfirm': 'Are you sure you want to sign out?',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.alreadyHaveAccount': 'Already have an account?',
    
    // Status
    'status.pending': 'Pending',
    'status.confirmed': 'Confirmed',
    'status.inProgress': 'In Progress',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
  },
  am: {
    // Common
    'common.save': 'አስቀምጥ',
    'common.cancel': 'ሰርዝ',
    'common.edit': 'አርትዖ',
    'common.delete': 'ሰርዝ',
    'common.confirm': 'አረጋግጥ',
    'common.back': 'ተመለስ',
    'common.next': 'ቀጥል',
    'common.done': 'ተጠናቋል',
    'common.loading': 'በመጫን ላይ...',
    'common.error': 'ስህተት',
    'common.success': 'ተሳክቷል',
    'common.yes': 'አዎ',
    'common.no': 'አይ',
    'common.ok': 'እሺ',
    
    // Navigation
    'nav.jobs': 'ስራዎች',
    'nav.bookings': 'ቦታ ማስያዝ',
    'nav.chats': 'ውይይቶች',
    'nav.profile': 'መገለጫ',
    'nav.settings': 'ቅንብሮች',
    
    // Settings
    'settings.title': 'ቅንብሮች',
    'settings.language': 'ቋንቋ',
    'settings.notifications': 'ማሳወቂያዎች',
    'settings.privacy': 'ግላዊነት እና ደህንነት',
    'settings.account': 'መለያ',
    'settings.about': 'ስለ',
    'settings.help': 'እርዳታ እና ድጋፍ',
    'settings.app': 'መተግበሪያ',
    'settings.language.select': 'ቋንቋ ይምረጡ',
    'settings.language.english': 'English',
    'settings.language.amharic': 'አማርኛ',
    'settings.language.description': 'የሚመርጡትን ቋንቋ ይምረጡ',
    'settings.language.selectDescription': 'ለመተግበሪያው የሚመርጡትን ቋንቋ ይምረጡ',
    'settings.language.changed': 'ቋንቋ በተሳካ ሁኔታ ተቀይሯል',
    'settings.language.changeError': 'ቋንቋ መቀየር አልተሳካም',
    'settings.privacyPolicy': 'የግላዊነት ፖሊሲ',
    'settings.privacyPolicyDesc': 'የግላዊነት ፖሊሲችንን ያንብቡ',
    'settings.termsOfService': 'የአገልግሎት ውሎች',
    'settings.termsOfServiceDesc': 'የአገልግሎት ውሎቻችንን ያንብቡ',
    'settings.dataExport': 'ውሂብ ላክ',
    'settings.dataExportDesc': 'ውሂብዎን ያውርዱ',
    'settings.dataExportComingSoon': 'የውሂብ ላክ ባህሪ በቅርቡ ይመጣል',
    'settings.deleteAccount': 'መለያ ሰርዝ',
    'settings.deleteAccountDesc': 'መለያዎን ለዘለዓለም ሰርዝ',
    'settings.deleteAccountConfirm': 'መለያዎን መሰረዝ እርግጠኛ ነዎት? ይህ ተግባር ሊቀለበስ አይችልም።',
    'settings.deleteAccountComingSoon': 'የመለያ ሰረዝ ባህሪ በቅርቡ ይመጣል',
    'settings.editProfile': 'መገለጫ አርትዖ',
    'settings.editProfileDesc': 'የግል መረጃዎን ያዘምኑ',
    'settings.changePassword': 'የይለፍ ቃል ቀይር',
    'settings.changePasswordDesc': 'የይለፍ ቃልዎን ያዘምኑ',
    'settings.changePasswordComingSoon': 'የይለፍ ቃል ለውጥ ባህሪ በቅርቡ ይመጣል',
    'settings.twoFactorAuth': 'ሁለት-ደረጃ ማረጋገጫ',
    'settings.twoFactorAuthDesc': 'ለመለያዎ ተጨማሪ ደህንነት ያክሉ',
    'settings.twoFactorAuthComingSoon': 'ሁለት-ደረጃ ማረጋገጫ በቅርቡ ይመጣል',
    'settings.connectedAccounts': 'የተገናኙ መለያዎች',
    'settings.connectedAccountsDesc': 'የተገናኙ መለያዎችን ያቀናብሩ',
    'settings.connectedAccountsComingSoon': 'የተገናኙ መለያዎች ባህሪ በቅርቡ ይመጣል',
    'settings.theme': 'ገጽታ',
    'settings.themeDesc': 'የሚመርጡትን ገጽታ ይምረጡ',
    'settings.themeComingSoon': 'የገጽታ ምርጫ በቅርቡ ይመጣል',
    'settings.fontSize': 'የፊደል መጠን',
    'settings.fontSizeDesc': 'የጽሑፍ መጠን ያስተካክሉ',
    'settings.fontSizeComingSoon': 'የፊደል መጠን ማስተካከያ በቅርቡ ይመጣል',
    'settings.cache': 'ካሽ አጽዳ',
    'settings.cacheDesc': 'የመተግበሪያ ካሽ አጽዳ',
    'settings.cacheComingSoon': 'የካሽ አያያዝ በቅርቡ ይመጣል',
    'settings.storage': 'አከማችት',
    'settings.storageDesc': 'የመተግበሪያ አከማችት ያቀናብሩ',
    'settings.storageComingSoon': 'የአከማችት አያያዝ በቅርቡ ይመጣል',
    'settings.helpCenter': 'የእርዳታ ማዕከል',
    'settings.helpCenterDesc': 'የእርዳታ ጽሑፎችን ያስሱ',
    'settings.helpCenterComingSoon': 'የእርዳታ ማዕከል በቅርቡ ይመጣል',
    'settings.contactSupport': 'ድጋፍ ያግኙ',
    'settings.contactSupportDesc': 'ከቡድናችን እርዳታ ያግኙ',
    'settings.feedback': 'ግቤት ላክ',
    'settings.feedbackDesc': 'አስተያየትዎን ያካፍሉ',
    'settings.feedbackComingSoon': 'የግቤት ስርዓት በቅርቡ ይመጣል',
    'settings.rateApp': 'መተግበሪያ ይገምግሙ',
    'settings.rateAppDesc': 'በመተግበሪያ ማውጫ ይገምግሙን',
    'settings.rateAppComingSoon': 'የመተግበሪያ ግምገማ በቅርቡ ይመጣል',
    'settings.version': 'ሥሪት',
    'settings.build': 'ግንባታ',
    'settings.legal': 'ሕጋዊ',
    'settings.legalDesc': 'ሕጋዊ መረጃ',
    'settings.legalComingSoon': 'ሕጋዊ መረጃ በቅርቡ ይመጣል',
    
    // Profile
    'profile.title': 'መገለጫ',
    'profile.personalInfo': 'የግል መረጃ',
    'profile.professionalInfo': 'የሙያ መረጃ',
    'profile.location': 'አካባቢ',
    'profile.quickActions': 'ፈጣን ተግባሮች',
    'profile.becomeTasker': 'ስራ አጫዋች ይሁኑ',
    'profile.taskerStatus': 'የስራ አጫዋች ሁኔታ',
    'profile.signOut': 'ውጣ',
    'profile.fullName': 'ሙሉ ስም',
    'profile.username': 'የተጠቃሚ ስም',
    'profile.email': 'ኢሜይል',
    'profile.phone': 'ስልክ',
    'profile.bio': 'ስለ እርስዎ',
    'profile.city': 'ከተማ',
    'profile.state': 'ክልል',
    'profile.memberSince': 'ከመታተር ጀምሮ',
    'profile.hourlyRate': 'የሰዓት ክፍያ',
    'profile.experienceYears': 'የልምምድ ዓመታት',
    'profile.responseTime': 'የመልስ ጊዜ',
    'profile.skills': 'ችሎታዎች',
    'profile.certifications': 'ማረጋገጫዎች',
    'profile.languages': 'ቋንቋዎች',
    'profile.availableForWork': 'ለስራ የሚመጣ',
    'profile.jobsCompleted': 'የተጠናቀቁ ስራዎች',
    'profile.rating': 'ደረጃ',
    'profile.reviews': 'ግምገማዎች',
    'profile.available': 'የሚገኝ',
    'profile.notAvailable': 'የማይገኝ',
    'profile.myBookings': 'የኔ ቦታ ማስያዝ',
    'profile.noBookings': 'እስካሁን ቦታ ማስያዝ የለም',
    'profile.viewAllTasks': 'ሁሉንም ተግባሮች ይመልከቱ',
    
    // Jobs
    'jobs.title': 'ስራዎች',
    'jobs.postTask': 'ስራ ለጥፍ',
    'jobs.findTaskers': 'ስራ አጫዋቾችን ፈልግ',
    'jobs.activeWork': 'ንቁ ስራ',
    'jobs.completed': 'ተጠናቋል',
    'jobs.cancelled': 'ተሰርዟል',
    
    // Bookings
    'bookings.title': 'ቦታ ማስያዝ',
    'bookings.upcoming': 'የሚመጣ',
    'bookings.past': 'ያለፈ',
    'bookings.noBookings': 'ቦታ ማስያዝ አልተገኘም',
    
    // Chats
    'chats.title': 'ውይይቶች',
    'chats.noMessages': 'እስካሁን መልዕክት የለም',
    'chats.startConversation': 'ውይይት ጀምር',
    
    // Notifications
    'notifications.title': 'ማሳወቂያዎች',
    'notifications.markAllRead': 'ሁሉንም እንደ ተነበበ ምልክት አድርግ',
    'notifications.markAllReadError': 'ማሳወቂያዎችን እንደ ተነበበ ምልክት ማድረግ አልተሳካም',
    'notifications.types': 'የማሳወቂያ ዓይነቶች',
    'notifications.deliveryMethods': 'የማስተላለፊያ ዘዴዎች',
    'notifications.applicationUpdates': 'የመተግበሪያ ማዘመኛዎች',
    'notifications.applicationUpdatesDesc': 'መተግበሪያዎችዎ ሲዘመኑ ማሳወቂያ ያግኙ',
    'notifications.directBookings': 'ቀጥተኛ ቦታ ማስያዝ',
    'notifications.directBookingsDesc': 'ለአዲስ ቦታ ማስያዝ ማሳወቂያ ያግኙ',
    'notifications.taskUpdates': 'የስራ ማዘመኛዎች',
    'notifications.taskUpdatesDesc': 'ስለ ስራ ለውጦች ያሳውቁ',
    'notifications.messages': 'መልዕክቶች',
    'notifications.messagesDesc': 'ስለ አዲስ መልዕክቶች ማሳወቂያ ያግኙ',
    'notifications.reviews': 'ግምገማዎች',
    'notifications.reviewsDesc': 'ለአዲስ ግምገማዎች ማሳወቂያ ያግኙ',
    'notifications.systemNotifications': 'የስርዓት ማሳወቂያዎች',
    'notifications.systemNotificationsDesc': 'አስፈላጊ የመተግበሪያ ማዘመኛዎች እና ማስታወቂያዎች',
    'notifications.pushNotifications': 'የግጭት ማሳወቂያዎች',
    'notifications.pushNotificationsDesc': 'በመሳሪያዎ ላይ ማሳወቂያዎች ያግኙ',
    'notifications.emailNotifications': 'የኢሜይል ማሳወቂያዎች',
    'notifications.emailNotificationsDesc': 'በኢሜይል ማሳወቂያዎች ያግኙ',
    
    // Auth
    'auth.signIn': 'ግባ',
    'auth.signUp': 'ተመዝግብ',
    'auth.signOut': 'ውጣ',
    'auth.signOutConfirm': 'ውጣ እርግጠኛ ነዎት?',
    'auth.email': 'ኢሜይል',
    'auth.password': 'የይለፍ ቃል',
    'auth.confirmPassword': 'የይለፍ ቃል አረጋግጥ',
    'auth.forgotPassword': 'የይለፍ ቃል ረሳህ?',
    'auth.dontHaveAccount': 'መለያ የለህም?',
    'auth.alreadyHaveAccount': 'አስቀድመህ መለያ አለህ?',
    
    // Status
    'status.pending': 'በመጠባበቅ ላይ',
    'status.confirmed': 'ተረጋግጧል',
    'status.inProgress': 'በሂደት ላይ',
    'status.completed': 'ተጠናቋል',
    'status.cancelled': 'ተሰርዟል',
  }
}

const STORAGE_KEY = '@language_preference'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [isLoading, setIsLoading] = useState(true)

  // Load saved language preference on app start
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY)
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'am')) {
          setLanguageState(savedLanguage as Language)
        }
      } catch (error) {
        console.error('Error loading language preference:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLanguagePreference()
  }, [])

  const setLanguage = useCallback(async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLanguage)
      setLanguageState(newLanguage)
    } catch (error) {
      console.error('Error saving language preference:', error)
      throw error
    }
  }, [])

  const t = useCallback((key: string): string => {
    // Return early if still loading
    if (isLoading) {
      return key
    }
    
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to English if translation not found
        value = translations.en
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key // Return key if no translation found
          }
        }
        break
      }
    }
    
    return typeof value === 'string' ? value : key
  }, [language, isLoading])

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isLoading,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
