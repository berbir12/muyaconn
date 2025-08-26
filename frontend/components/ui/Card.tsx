import React from 'react'
import {
  View,
  TouchableOpacity,
  ViewStyle,
  StyleSheet,
  Pressable,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Colors from '../../constants/Colors'
import { Spacing, BorderRadius, Shadows, CommonStyles } from '../../constants/Design'

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'gradient'

interface CardProps {
  children: React.ReactNode
  variant?: CardVariant
  onPress?: () => void
  style?: ViewStyle
  gradient?: string[]
  padding?: number
  margin?: number
  disabled?: boolean
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  gradient,
  padding = Spacing.lg,
  margin = 0,
  disabled = false,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: Colors.background.primary,
      borderRadius: BorderRadius.lg,
      padding,
      margin,
    }

    switch (variant) {
      case 'default':
        return {
          ...baseStyle,
          ...Shadows.sm,
        }
      case 'elevated':
        return {
          ...baseStyle,
          ...Shadows.lg,
        }
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: Colors.border.light,
          ...Shadows.none,
        }
      case 'gradient':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          ...Shadows.lg,
        }
    }
  }

  const cardStyle = getCardStyle()

  if (variant === 'gradient' && gradient) {
    if (onPress && !disabled) {
      return (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={[{ borderRadius: BorderRadius.lg, overflow: 'hidden' }, style]}
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[cardStyle, { backgroundColor: 'transparent' }]}
          >
            {children}
          </LinearGradient>
        </Pressable>
      )
    }

    return (
      <View style={[{ borderRadius: BorderRadius.lg, overflow: 'hidden' }, style]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[cardStyle, { backgroundColor: 'transparent' }]}
        >
          {children}
        </LinearGradient>
      </View>
    )
  }

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[cardStyle, style]}
        activeOpacity={0.95}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  )
}

export default Card