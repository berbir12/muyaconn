import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Colors from '../../constants/Colors'
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/Design'

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'chat' | 'application_accepted' | 'application_declined' | 'direct_booking'

interface NotificationBannerProps {
  type: NotificationType
  title: string
  message: string
  isVisible: boolean
  onPress?: () => void
  onDismiss: () => void
  autoHideDuration?: number
  showProgress?: boolean
}

const { width: screenWidth } = Dimensions.get('window')

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type,
  title,
  message,
  isVisible,
  onPress,
  onDismiss,
  autoHideDuration = 4000,
  showProgress = true,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current
  const progressWidth = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    if (isVisible) {
      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start()

      // Progress bar animation
      if (showProgress) {
        Animated.timing(progressWidth, {
          toValue: 1,
          duration: autoHideDuration,
          useNativeDriver: false,
        }).start()
      }

      // Auto hide
      const hideTimer = setTimeout(() => {
        onDismiss()
      }, autoHideDuration)

      return () => clearTimeout(hideTimer)
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isVisible])

  const getNotificationConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          colors: Colors.gradients.emerald,
          iconColor: Colors.success[600],
          borderColor: Colors.success[500],
        }
      case 'error':
        return {
          icon: 'close-circle' as const,
          colors: Colors.gradients.sunset,
          iconColor: Colors.error[600],
          borderColor: Colors.error[500],
        }
      case 'warning':
        return {
          icon: 'warning' as const,
          colors: [Colors.warning[400], Colors.warning[600]],
          iconColor: Colors.warning[600],
          borderColor: Colors.warning[500],
        }
      case 'info':
        return {
          icon: 'information-circle' as const,
          colors: Colors.gradients.ocean,
          iconColor: Colors.primary[600],
          borderColor: Colors.primary[500],
        }
      case 'chat':
        return {
          icon: 'chatbubble' as const,
          colors: Colors.gradients.primary,
          iconColor: Colors.primary[600],
          borderColor: Colors.primary[500],
        }
      case 'application_accepted':
        return {
          icon: 'checkmark-circle' as const,
          colors: Colors.gradients.emerald,
          iconColor: Colors.success[600],
          borderColor: Colors.success[500],
        }
      case 'application_declined':
        return {
          icon: 'close-circle' as const,
          colors: Colors.gradients.sunset,
          iconColor: Colors.error[600],
          borderColor: Colors.error[500],
        }
      case 'direct_booking':
        return {
          icon: 'calendar' as const,
          colors: Colors.gradients.ocean,
          iconColor: Colors.primary[600],
          borderColor: Colors.primary[500],
        }
    }
  }

  const config = getNotificationConfig()

  const progressWidthInterpolate = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%'],
  })

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchableContainer}
        onPress={onPress}
        activeOpacity={onPress ? 0.9 : 1}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.notification, { borderLeftColor: config.borderColor }]}
        >
          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: `${config.iconColor}15` }]}>
                <Ionicons name={config.icon} size={24} color={config.iconColor} />
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.message} numberOfLines={2}>
                {message}
              </Text>
            </View>

            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          {showProgress && (
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressWidthInterpolate,
                    backgroundColor: config.borderColor,
                  },
                ]}
              />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: Spacing.lg,
    paddingTop: 60, // Account for status bar and safe area
  },
  touchableContainer: {
    width: '100%',
  },
  notification: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    overflow: 'hidden',
    ...Shadows.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.sm,
  },
  dismissButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  progressContainer: {
    height: 3,
    backgroundColor: Colors.neutral[100],
  },
  progressBar: {
    height: '100%',
  },
})

export default NotificationBanner