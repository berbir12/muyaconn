import React, { createContext, useContext, useState, ReactNode } from 'react'
import NotificationBanner, { NotificationType } from '../components/ui/NotificationBanner'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  onPress?: () => void
  autoHideDuration?: number
  showProgress?: boolean
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void
  showSuccess: (title: string, message: string, onPress?: () => void) => void
  showError: (title: string, message: string, onPress?: () => void) => void
  showWarning: (title: string, message: string, onPress?: () => void) => void
  showInfo: (title: string, message: string, onPress?: () => void) => void
  showChat: (title: string, message: string, onPress?: () => void) => void
  hideNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null)

  const showNotification = (newNotification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    setNotification({
      ...newNotification,
      id,
    })
  }

  const showSuccess = (title: string, message: string, onPress?: () => void) => {
    showNotification({
      type: 'success',
      title,
      message,
      onPress,
    })
  }

  const showError = (title: string, message: string, onPress?: () => void) => {
    showNotification({
      type: 'error',
      title,
      message,
      onPress,
      autoHideDuration: 6000, // Longer duration for errors
    })
  }

  const showWarning = (title: string, message: string, onPress?: () => void) => {
    showNotification({
      type: 'warning',
      title,
      message,
      onPress,
      autoHideDuration: 5000,
    })
  }

  const showInfo = (title: string, message: string, onPress?: () => void) => {
    showNotification({
      type: 'info',
      title,
      message,
      onPress,
    })
  }

  const showChat = (title: string, message: string, onPress?: () => void) => {
    showNotification({
      type: 'chat',
      title,
      message,
      onPress,
      autoHideDuration: 6000,
    })
  }

  const hideNotification = (id: string) => {
    if (notification?.id === id) {
      setNotification(null)
    }
  }

  const handleDismiss = () => {
    setNotification(null)
  }

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showChat,
    hideNotification,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Banner */}
      {notification && (
        <NotificationBanner
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={!!notification}
          onPress={notification.onPress}
          onDismiss={handleDismiss}
          autoHideDuration={notification.autoHideDuration}
          showProgress={notification.showProgress}
        />
      )}
    </NotificationContext.Provider>
  )
}