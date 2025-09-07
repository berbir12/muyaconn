import React, { useRef } from 'react'
import { Animated, TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Animation, Layout, BorderRadius } from '../constants/Design'
import Colors from '../constants/Colors'

interface AnimatedButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  icon?: keyof typeof Ionicons.glyphMap
  iconPosition?: 'left' | 'right'
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export default function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const opacityAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          duration: Animation.duration.fast,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: Animation.duration.fast,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          duration: Animation.duration.fast,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: Animation.duration.fast,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = {
      height: size === 'small' ? 36 : size === 'large' ? Layout.height.buttonLarge : Layout.height.button,
      borderRadius: size === 'small' ? BorderRadius.sm : BorderRadius.md,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: size === 'small' ? 12 : size === 'large' ? 24 : 16,
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.neutral[300] : Colors.primary[500],
        }
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.neutral[200] : Colors.neutral[100],
        }
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? Colors.neutral[300] : Colors.primary[500],
        }
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        }
      default:
        return baseStyle
    }
  }

  const getTextStyle = (): TextStyle => {
    const baseStyle = {
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      fontWeight: '600' as const,
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: disabled ? Colors.text.tertiary : Colors.text.inverse,
        }
      case 'secondary':
        return {
          ...baseStyle,
          color: disabled ? Colors.text.tertiary : Colors.text.primary,
        }
      case 'outline':
        return {
          ...baseStyle,
          color: disabled ? Colors.text.tertiary : Colors.primary[500],
        }
      case 'ghost':
        return {
          ...baseStyle,
          color: disabled ? Colors.text.tertiary : Colors.primary[500],
        }
      default:
        return baseStyle
    }
  }

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Animated.View style={[getButtonStyle(), animatedStyle, style]}>
        {loading ? (
          <Animated.Text style={[getTextStyle(), textStyle]}>
            Loading...
          </Animated.Text>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={size === 'small' ? 16 : size === 'large' ? 20 : 18}
                color={getTextStyle().color}
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon}
                size={size === 'small' ? 16 : size === 'large' ? 20 : 18}
                color={getTextStyle().color}
                style={{ marginLeft: 8 }}
              />
            )}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}
