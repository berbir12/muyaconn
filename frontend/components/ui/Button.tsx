import React from 'react'
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../../constants/Colors'
import { Spacing, BorderRadius, Typography, Shadows, CommonStyles } from '../../constants/Design'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  gradient?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  iconPosition?: 'left' | 'right'
  style?: ViewStyle
  textStyle?: TextStyle
  fullWidth?: boolean
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  gradient = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          background: Colors.primary[500],
          text: Colors.text.inverse,
          border: Colors.primary[500],
        }
      case 'secondary':
        return {
          background: Colors.neutral[100],
          text: Colors.text.primary,
          border: Colors.neutral[200],
        }
      case 'outline':
        return {
          background: 'transparent',
          text: Colors.primary[500],
          border: Colors.primary[500],
        }
      case 'ghost':
        return {
          background: 'transparent',
          text: Colors.primary[500],
          border: 'transparent',
        }
      case 'success':
        return {
          background: Colors.success[500],
          text: Colors.text.inverse,
          border: Colors.success[500],
        }
      case 'warning':
        return {
          background: Colors.warning[500],
          text: Colors.text.inverse,
          border: Colors.warning[500],
        }
      case 'error':
        return {
          background: Colors.error[500],
          text: Colors.text.inverse,
          border: Colors.error[500],
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          height: 36,
          fontSize: Typography.fontSize.sm,
        }
      case 'md':
        return {
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          height: 48,
          fontSize: Typography.fontSize.md,
        }
      case 'lg':
        return {
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.lg,
          height: 56,
          fontSize: Typography.fontSize.lg,
        }
      case 'xl':
        return {
          paddingHorizontal: Spacing.xxl,
          paddingVertical: Spacing.xl,
          height: 64,
          fontSize: Typography.fontSize.xl,
        }
    }
  }

  const colors = getButtonColors()
  const sizeStyles = getSizeStyles()
  const isPressed = false

  const buttonStyle: ViewStyle = {
    ...CommonStyles.button,
    backgroundColor: colors.background,
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: colors.border,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    height: sizeStyles.height,
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : undefined,
    ...Shadows.sm,
    ...(variant === 'ghost' ? {} : Shadows.md),
  }

  const buttonTextStyle: TextStyle = {
    color: colors.text,
    fontSize: sizeStyles.fontSize,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  }

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 28

  if (gradient && variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          {
            borderRadius: BorderRadius.md,
            overflow: 'hidden',
            width: fullWidth ? '100%' : undefined,
            ...Shadows.lg,
          },
          style,
        ]}
      >
        <LinearGradient
          colors={Colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradientButton,
            {
              height: sizeStyles.height,
              paddingHorizontal: sizeStyles.paddingHorizontal,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text.inverse} size="small" />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <Ionicons 
                  name={icon} 
                  size={iconSize} 
                  color={Colors.text.inverse} 
                  style={styles.iconLeft} 
                />
              )}
              <Text style={[buttonTextStyle, { color: Colors.text.inverse }, textStyle]}>
                {title}
              </Text>
              {icon && iconPosition === 'right' && (
                <Ionicons 
                  name={icon} 
                  size={iconSize} 
                  color={Colors.text.inverse} 
                  style={styles.iconRight} 
                />
              )}
            </>
          )}
        </LinearGradient>
      </Pressable>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[buttonStyle, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={iconSize} 
              color={colors.text} 
              style={styles.iconLeft} 
            />
          )}
          <Text style={[buttonTextStyle, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={iconSize} 
              color={colors.text} 
              style={styles.iconRight} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
})

export default Button